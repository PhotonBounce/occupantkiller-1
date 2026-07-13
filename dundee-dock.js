window.DundeeDock = (function() {
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
        build();
    }

    function build() {
        // Massive dock crane
        buildCrane();
        // Warehouse row
        buildWarehouses();
        // Dock wall with gun ports
        buildDockWall();
        // Military command post
        buildCommandPost();
        // Moored patrol boat
        buildPatrolBoat();
        // Container stack barricade
        buildContainerStack();
        // Searchlight tower
        buildSearchlightTower();
        // Anti-ship gun emplacement
        buildGunEmplacement();
        // Add lighting
        buildLights();
    }

    function buildCrane() {
        var baseOffsetX = 220;
        var baseOffsetZ = 110;

        // Crane post (vertical cylinder)
        var postGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 16);
        var postMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(baseOffsetX, 12.5, baseOffsetZ);
        scene.add(post);
        objects.push(post);

        // Crane arm (horizontal box)
        var armGeometry = new THREE.BoxGeometry(30, 2, 2);
        var armMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(baseOffsetX + 15, 24, baseOffsetZ);
        scene.add(arm);
        objects.push(arm);

        // Counterweight (box on rear)
        var counterGeometry = new THREE.BoxGeometry(4, 8, 4);
        var counterMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var counter = new THREE.Mesh(counterGeometry, counterMaterial);
        counter.position.set(baseOffsetX - 16, 24, baseOffsetZ);
        scene.add(counter);
        objects.push(counter);
    }

    function buildWarehouses() {
        var baseOffsetX = 220;
        var baseOffsetZ = 90;
        var brickColor = 0x8B3626;
        var brickMaterial = new THREE.MeshLambertMaterial({ color: brickColor });

        // Three connected warehouse blocks
        var warehouseGeometry = new THREE.BoxGeometry(8, 6, 5);

        // Warehouse 1
        var wh1 = new THREE.Mesh(warehouseGeometry, brickMaterial);
        wh1.position.set(baseOffsetX - 8, 3, baseOffsetZ);
        scene.add(wh1);
        objects.push(wh1);

        // Warehouse 2 (center)
        var wh2 = new THREE.Mesh(warehouseGeometry, brickMaterial);
        wh2.position.set(baseOffsetX, 3, baseOffsetZ);
        scene.add(wh2);
        objects.push(wh2);

        // Warehouse 3
        var wh3 = new THREE.Mesh(warehouseGeometry, brickMaterial);
        wh3.position.set(baseOffsetX + 8, 3, baseOffsetZ);
        scene.add(wh3);
        objects.push(wh3);
    }

    function buildDockWall() {
        var baseOffsetX = 215;
        var baseOffsetZ = 75;
        var stoneColor = 0x555555;
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: stoneColor });

        // Main wall
        var wallGeometry = new THREE.BoxGeometry(20, 3, 1);
        var wall = new THREE.Mesh(wallGeometry, stoneMaterial);
        wall.position.set(baseOffsetX, 1.5, baseOffsetZ);
        scene.add(wall);
        objects.push(wall);

        // Gun ports (small openings in wall - created with smaller boxes on surface)
        var portGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.5);
        var portMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

        var positions = [
            { x: baseOffsetX - 8, z: baseOffsetZ },
            { x: baseOffsetX - 2, z: baseOffsetZ },
            { x: baseOffsetX + 4, z: baseOffsetZ },
            { x: baseOffsetX + 10, z: baseOffsetZ }
        ];

        for (var i = 0; i < positions.length; i++) {
            var port = new THREE.Mesh(portGeometry, portMaterial);
            port.position.set(positions[i].x, 2.2, positions[i].z);
            scene.add(port);
            objects.push(port);
        }
    }

    function buildCommandPost() {
        var baseOffsetX = 240;
        var baseOffsetZ = 100;
        var darkColor = 0x1a1a1a;
        var darkMaterial = new THREE.MeshLambertMaterial({ color: darkColor });

        var postGeometry = new THREE.BoxGeometry(6, 8, 6);
        var post = new THREE.Mesh(postGeometry, darkMaterial);
        post.position.set(baseOffsetX, 4, baseOffsetZ);
        scene.add(post);
        objects.push(post);

        // Roof (flat top)
        var roofGeometry = new THREE.BoxGeometry(6.5, 0.5, 6.5);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(baseOffsetX, 8.25, baseOffsetZ);
        scene.add(roof);
        objects.push(roof);

        // Observation turret on roof
        var turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
        var turretMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var turret = new THREE.Mesh(turretGeometry, turretMaterial);
        turret.position.set(baseOffsetX, 9.5, baseOffsetZ);
        scene.add(turret);
        objects.push(turret);
    }

    function buildPatrolBoat() {
        var baseOffsetX = 235;
        var baseOffsetZ = 125;
        var navyColor = 0x555555;
        var navyMaterial = new THREE.MeshLambertMaterial({ color: navyColor });

        // Hull (main body)
        var hullGeometry = new THREE.BoxGeometry(8, 2, 2);
        var hull = new THREE.Mesh(hullGeometry, navyMaterial);
        hull.position.set(baseOffsetX, 1, baseOffsetZ);
        scene.add(hull);
        objects.push(hull);

        // Bridge/superstructure
        var bridgeGeometry = new THREE.BoxGeometry(3, 3, 2);
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(baseOffsetX - 1.5, 3, baseOffsetZ);
        scene.add(bridge);
        objects.push(bridge);

        // Gun mount (small cylinder on top)
        var gunGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
        var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gun = new THREE.Mesh(gunGeometry, gunMaterial);
        gun.position.set(baseOffsetX + 2, 4.5, baseOffsetZ);
        scene.add(gun);
        objects.push(gun);
    }

    function buildContainerStack() {
        var baseOffsetX = 200;
        var baseOffsetZ = 110;
        var colors = [0xCC0000, 0x0066CC, 0xFFCC00, 0x00AA00];

        // Stack of 4 containers (3x2x2 each)
        var containerGeometry = new THREE.BoxGeometry(3, 2, 2);

        var positions = [
            { x: 0, y: 1, z: 0 },     // Container 1 (bottom)
            { x: 3.5, y: 1, z: 0 },   // Container 2 (bottom right)
            { x: 0, y: 3.2, z: 0 },   // Container 3 (top left)
            { x: 3.5, y: 3.2, z: 0 }  // Container 4 (top right)
        ];

        for (var i = 0; i < positions.length; i++) {
            var containerMaterial = new THREE.MeshLambertMaterial({ color: colors[i] });
            var container = new THREE.Mesh(containerGeometry, containerMaterial);
            container.position.set(baseOffsetX + positions[i].x, positions[i].y, baseOffsetZ + positions[i].z);
            scene.add(container);
            objects.push(container);
        }
    }

    function buildSearchlightTower() {
        var baseOffsetX = 255;
        var baseOffsetZ = 95;

        // Tower base (cylinder)
        var towerGeometry = new THREE.CylinderGeometry(1, 1, 15, 12);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(baseOffsetX, 7.5, baseOffsetZ);
        scene.add(tower);
        objects.push(tower);

        // Searchlight head (sphere)
        var lightHeadGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        var lightHeadMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF99 });
        var lightHead = new THREE.Mesh(lightHeadGeometry, lightHeadMaterial);
        lightHead.position.set(baseOffsetX, 15.5, baseOffsetZ);
        scene.add(lightHead);
        objects.push(lightHead);

        // Light cone (cone geometry pointing outward)
        var coneGeometry = new THREE.ConeGeometry(2, 4, 16);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFCC });
        var cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(baseOffsetX + 3, 15.5, baseOffsetZ);
        cone.rotation.z = Math.PI / 2;
        scene.add(cone);
        objects.push(cone);
    }

    function buildGunEmplacement() {
        var baseOffsetX = 210;
        var baseOffsetZ = 130;

        // Rotating gun base (cylinder)
        var baseGeometry = new THREE.CylinderGeometry(3, 3, 1.5, 16);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(baseOffsetX, 0.75, baseOffsetZ);
        scene.add(base);
        objects.push(base);

        // Gun barrel (cylinder)
        var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 12);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(baseOffsetX + 4, 2.5, baseOffsetZ);
        barrel.rotation.z = Math.PI / 8;
        scene.add(barrel);
        objects.push(barrel);

        // Gun breech (cylinder - back of gun)
        var breechGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 10);
        var breechMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var breech = new THREE.Mesh(breechGeometry, breechMaterial);
        breech.position.set(baseOffsetX - 1.5, 2.5, baseOffsetZ);
        breech.rotation.z = Math.PI / 8;
        scene.add(breech);
        objects.push(breech);

        // Ammunition storage (box)
        var ammoGeometry = new THREE.BoxGeometry(2, 2, 3);
        var ammoMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var ammo = new THREE.Mesh(ammoGeometry, ammoMaterial);
        ammo.position.set(baseOffsetX - 3, 1.5, baseOffsetZ - 3);
        scene.add(ammo);
        objects.push(ammo);
    }

    function buildLights() {
        // Ambient light for general illumination
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun)
        var sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        sunLight.position.set(250, 30, 120);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);

        // Spotlight from searchlight tower
        var spotlight = new THREE.SpotLight(0xFFFF99, 1.5, 60, Math.PI / 4, 0.5, 2);
        spotlight.position.set(255, 15.5, 95);
        spotlight.target.position.set(220, 0, 110);
        scene.add(spotlight);
        scene.add(spotlight.target);
        lights.push(spotlight);

        // Warning light from command post
        var warningLight = new THREE.PointLight(0xFF0000, 0.6, 30);
        warningLight.position.set(240, 8.5, 100);
        scene.add(warningLight);
        lights.push(warningLight);
    }

    function update(delta) {
        // Update searchlight cone direction (gentle rotation)
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry instanceof THREE.ConeGeometry) {
                    objects[i].rotation.y += delta * 0.3;
                }
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
