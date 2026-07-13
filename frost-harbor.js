window.FrostHarbor = (function() {
	'use strict';

	var sceneRef = null;
	var cameraRef = null;
	var objects = [];
	var lights = [];
	var craneArm = null;
	var submarineHatch = null;
	var iceChunks = [];
	var craneRotation = 0;
	var hatchOpening = 0;

	function init(sceneRefParam, cameraRefParam) {
		sceneRef = sceneRefParam;
		cameraRef = cameraRefParam;
		objects = [];
		lights = [];
		iceChunks = [];
		craneRotation = 0;
		hatchOpening = 0;

		buildGround();
		buildIceCliffs();
		buildWarships();
		buildDocks();
		buildFortress();
		buildCranes();
		buildResearchStation();
		buildSubmarineDock();
		buildIceCaverns();
		buildSupplyShips();
		buildEnvironmentDetails();
		setupLights();
	}

	function buildGround() {
		var groundGeom = new THREE.BoxGeometry(600, 2, 600);
		var groundMat = new THREE.MeshLambertMaterial({color: 0xE8F4F8});
		var ground = new THREE.Mesh(groundGeom, groundMat);
		ground.position.y = -1;
		sceneRef.add(ground);
		objects.push(ground);
	}

	function buildIceCliffs() {
		var cliffGeom = new THREE.BoxGeometry(150, 120, 80);
		var cliffMat = new THREE.MeshLambertMaterial({color: 0xB0E0E6});
		var cliff1 = new THREE.Mesh(cliffGeom, cliffMat);
		cliff1.position.set(200, 50, -250);
		sceneRef.add(cliff1);
		objects.push(cliff1);

		var cliff2 = new THREE.Mesh(cliffGeom, cliffMat);
		cliff2.position.set(-200, 60, -280);
		sceneRef.add(cliff2);
		objects.push(cliff2);

		var cliffGeom2 = new THREE.BoxGeometry(200, 90, 60);
		var cliff3 = new THREE.Mesh(cliffGeom2, cliffMat);
		cliff3.position.set(0, 40, 250);
		sceneRef.add(cliff3);
		objects.push(cliff3);

		var coneGeom = new THREE.ConeGeometry(80, 100, 8);
		var coneMat = new THREE.MeshLambertMaterial({color: 0x87CEEB});
		var iceMount1 = new THREE.Mesh(coneGeom, coneMat);
		iceMount1.position.set(250, 60, 200);
		sceneRef.add(iceMount1);
		objects.push(iceMount1);

		var iceMount2 = new THREE.Mesh(coneGeom, coneMat);
		iceMount2.position.set(-250, 55, 220);
		sceneRef.add(iceMount2);
		objects.push(iceMount2);
	}

	function buildWarships() {
		var hullGeom = new THREE.BoxGeometry(60, 30, 150);
		var hullMat = new THREE.MeshLambertMaterial({color: 0x404040});
		var ship1 = new THREE.Mesh(hullGeom, hullMat);
		ship1.position.set(-100, 15, 50);
		sceneRef.add(ship1);
		objects.push(ship1);

		var superGeom = new THREE.BoxGeometry(35, 40, 50);
		var superMat = new THREE.MeshLambertMaterial({color: 0x505050});
		var super1 = new THREE.Mesh(superGeom, superMat);
		super1.position.set(-100, 50, 40);
		sceneRef.add(super1);
		objects.push(super1);

		var turretGeom = new THREE.CylinderGeometry(12, 12, 15, 8);
		var turretMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
		var turret1 = new THREE.Mesh(turretGeom, turretMat);
		turret1.position.set(-100, 75, 30);
		sceneRef.add(turret1);
		objects.push(turret1);

		var gunGeom = new THREE.CylinderGeometry(3, 3, 40, 6);
		var gunMat = new THREE.MeshLambertMaterial({color: 0x2A2A2A});
		var gun1 = new THREE.Mesh(gunGeom, gunMat);
		gun1.rotation.z = Math.PI * 0.3;
		gun1.position.set(-95, 80, 30);
		sceneRef.add(gun1);
		objects.push(gun1);

		var ship2 = new THREE.Mesh(hullGeom, hullMat);
		ship2.position.set(120, 15, 80);
		sceneRef.add(ship2);
		objects.push(ship2);

		var super2 = new THREE.Mesh(superGeom, superMat);
		super2.position.set(120, 50, 70);
		sceneRef.add(super2);
		objects.push(super2);

		var turret2 = new THREE.Mesh(turretGeom, turretMat);
		turret2.position.set(120, 75, 60);
		sceneRef.add(turret2);
		objects.push(turret2);

		var gun2 = new THREE.Mesh(gunGeom, gunMat);
		gun2.rotation.z = Math.PI * 0.4;
		gun2.position.set(125, 80, 60);
		sceneRef.add(gun2);
		objects.push(gun2);

		var iceBlockGeom = new THREE.BoxGeometry(70, 15, 160);
		var iceMat = new THREE.MeshLambertMaterial({color: 0xD0E8F2});
		var iceAround1 = new THREE.Mesh(iceBlockGeom, iceMat);
		iceAround1.position.set(-100, 5, 50);
		sceneRef.add(iceAround1);
		objects.push(iceAround1);

		var iceAround2 = new THREE.Mesh(iceBlockGeom, iceMat);
		iceAround2.position.set(120, 5, 80);
		sceneRef.add(iceAround2);
		objects.push(iceAround2);
	}

	function buildDocks() {
		var dockGeom = new THREE.BoxGeometry(200, 8, 60);
		var dockMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
		var dock1 = new THREE.Mesh(dockGeom, dockMat);
		dock1.position.set(-50, 8, 0);
		sceneRef.add(dock1);
		objects.push(dock1);

		var dock2 = new THREE.Mesh(dockGeom, dockMat);
		dock2.position.set(80, 8, 120);
		sceneRef.add(dock2);
		objects.push(dock2);

		var postGeom = new THREE.CylinderGeometry(6, 6, 40, 8);
		var postMat = new THREE.MeshLambertMaterial({color: 0x654321});
		for (var i = 0; i < 8; i++) {
			var post = new THREE.Mesh(postGeom, postMat);
			post.position.set(-80 + i * 25, 20, 0);
			sceneRef.add(post);
			objects.push(post);
		}

		var railGeom = new THREE.BoxGeometry(200, 2, 3);
		var railMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
		var rail1 = new THREE.Mesh(railGeom, railMat);
		rail1.position.set(-50, 35, 25);
		sceneRef.add(rail1);
		objects.push(rail1);

		var rail2 = new THREE.Mesh(railGeom, railMat);
		rail2.position.set(-50, 35, -25);
		sceneRef.add(rail2);
		objects.push(rail2);

		var iceGeom = new THREE.BoxGeometry(220, 3, 80);
		var iceDockMat = new THREE.MeshLambertMaterial({color: 0xE0F6FF});
		var iceDock = new THREE.Mesh(iceGeom, iceDockMat);
		iceDock.position.set(-50, 5, 0);
		sceneRef.add(iceDock);
		objects.push(iceDock);
	}

	function buildFortress() {
		var wallGeom = new THREE.BoxGeometry(100, 80, 20);
		var wallMat = new THREE.MeshLambertMaterial({color: 0x696969});
		var wall1 = new THREE.Mesh(wallGeom, wallMat);
		wall1.position.set(200, 40, -240);
		sceneRef.add(wall1);
		objects.push(wall1);

		var wall2 = new THREE.Mesh(wallGeom, wallMat);
		wall2.position.set(200, 40, -160);
		sceneRef.add(wall2);
		objects.push(wall2);

		var towerGeom = new THREE.CylinderGeometry(25, 25, 100, 8);
		var towerMat = new THREE.MeshLambertMaterial({color: 0x5A5A5A});
		var tower1 = new THREE.Mesh(towerGeom, towerMat);
		tower1.position.set(150, 50, -240);
		sceneRef.add(tower1);
		objects.push(tower1);

		var tower2 = new THREE.Mesh(towerGeom, towerMat);
		tower2.position.set(250, 50, -240);
		sceneRef.add(tower2);
		objects.push(tower2);

		var roofGeom = new THREE.ConeGeometry(28, 40, 8);
		var roofMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
		var roof1 = new THREE.Mesh(roofGeom, roofMat);
		roof1.position.set(150, 105, -240);
		sceneRef.add(roof1);
		objects.push(roof1);

		var roof2 = new THREE.Mesh(roofGeom, roofMat);
		roof2.position.set(250, 105, -240);
		sceneRef.add(roof2);
		objects.push(roof2);

		var battlementGeom = new THREE.BoxGeometry(100, 12, 20);
		var battlement = new THREE.Mesh(battlementGeom, wallMat);
		battlement.position.set(200, 90, -240);
		sceneRef.add(battlement);
		objects.push(battlement);

		var lookoutGeom = new THREE.BoxGeometry(40, 30, 40);
		var lookout = new THREE.Mesh(lookoutGeom, wallMat);
		lookout.position.set(200, 85, -200);
		sceneRef.add(lookout);
		objects.push(lookout);
	}

	function buildCranes() {
		var baseGeom = new THREE.BoxGeometry(30, 10, 30);
		var baseMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
		var craneBase1 = new THREE.Mesh(baseGeom, baseMat);
		craneBase1.position.set(-80, 5, -80);
		sceneRef.add(craneBase1);
		objects.push(craneBase1);

		var mast1Geom = new THREE.CylinderGeometry(4, 4, 80, 6);
		var mastMat = new THREE.MeshLambertMaterial({color: 0x6A5D4F});
		var mast1 = new THREE.Mesh(mast1Geom, mastMat);
		mast1.position.set(-80, 45, -80);
		sceneRef.add(mast1);
		objects.push(mast1);

		var armGeom = new THREE.BoxGeometry(120, 6, 6);
		var armMat = new THREE.MeshLambertMaterial({color: 0x5A5A5A});
		craneArm = new THREE.Mesh(armGeom, armMat);
		craneArm.position.set(-80, 85, -80);
		craneArm.pivot = new THREE.Vector3(-60, 85, -80);
		sceneRef.add(craneArm);
		objects.push(craneArm);

		var hookGeom = new THREE.CylinderGeometry(3, 3, 40, 6);
		var hookMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
		var hook1 = new THREE.Mesh(hookGeom, hookMat);
		hook1.position.set(-20, 45, -80);
		sceneRef.add(hook1);
		objects.push(hook1);

		var craneBase2 = new THREE.Mesh(baseGeom, baseMat);
		craneBase2.position.set(180, 5, 100);
		sceneRef.add(craneBase2);
		objects.push(craneBase2);

		var mast2 = new THREE.Mesh(mast1Geom, mastMat);
		mast2.position.set(180, 45, 100);
		sceneRef.add(mast2);
		objects.push(mast2);

		var arm2 = new THREE.Mesh(armGeom, armMat);
		arm2.position.set(180, 85, 100);
		sceneRef.add(arm2);
		objects.push(arm2);

		var hook2 = new THREE.Mesh(hookGeom, hookMat);
		hook2.position.set(260, 45, 100);
		sceneRef.add(hook2);
		objects.push(hook2);
	}

	function buildResearchStation() {
		var buildingGeom = new THREE.BoxGeometry(80, 60, 100);
		var buildingMat = new THREE.MeshLambertMaterial({color: 0xC0C0C0});
		var building1 = new THREE.Mesh(buildingGeom, buildingMat);
		building1.position.set(0, 30, -150);
		sceneRef.add(building1);
		objects.push(building1);

		var building2 = new THREE.Mesh(buildingGeom, buildingMat);
		building2.position.set(100, 30, -150);
		sceneRef.add(building2);
		objects.push(building2);

		var roofGeom = new THREE.ConeGeometry(50, 30, 6);
		var roofMat = new THREE.MeshLambertMaterial({color: 0x8B0000});
		var roof1 = new THREE.Mesh(roofGeom, roofMat);
		roof1.position.set(0, 65, -150);
		sceneRef.add(roof1);
		objects.push(roof1);

		var roof2 = new THREE.Mesh(roofGeom, roofMat);
		roof2.position.set(100, 65, -150);
		sceneRef.add(roof2);
		objects.push(roof2);

		var antennaGeom = new THREE.CylinderGeometry(2, 2, 50, 4);
		var antennaMat = new THREE.MeshLambertMaterial({color: 0x2A2A2A});
		var antenna1 = new THREE.Mesh(antennaGeom, antennaMat);
		antenna1.position.set(0, 95, -150);
		sceneRef.add(antenna1);
		objects.push(antenna1);

		var antenna2 = new THREE.Mesh(antennaGeom, antennaMat);
		antenna2.position.set(100, 95, -150);
		sceneRef.add(antenna2);
		objects.push(antenna2);

		var windowGeom = new THREE.BoxGeometry(12, 12, 2);
		var windowMat = new THREE.MeshLambertMaterial({color: 0x4080FF});
		for (var i = 0; i < 6; i++) {
			var window1 = new THREE.Mesh(windowGeom, windowMat);
			window1.position.set(-30 + i * 15, 40, -150);
			sceneRef.add(window1);
			objects.push(window1);
		}
	}

	function buildSubmarineDock() {
		var dockRoomGeom = new THREE.BoxGeometry(120, 80, 150);
		var dockMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
		var dockRoom = new THREE.Mesh(dockRoomGeom, dockMat);
		dockRoom.position.set(-200, 40, 150);
		sceneRef.add(dockRoom);
		objects.push(dockRoom);

		var submarineGeom = new THREE.CylinderGeometry(15, 15, 120, 8);
		var submarineMat = new THREE.MeshLambertMaterial({color: 0x333333});
		var submarine = new THREE.Mesh(submarineGeom, submarineMat);
		submarine.rotation.z = Math.PI * 0.5;
		submarine.position.set(-200, 30, 150);
		sceneRef.add(submarine);
		objects.push(submarine);

		var hatchGeom = new THREE.CylinderGeometry(8, 8, 3, 8);
		var hatchMat = new THREE.MeshLambertMaterial({color: 0x1A1A1A});
		submarineHatch = new THREE.Mesh(hatchGeom, hatchMat);
		submarineHatch.position.set(-200, 40, 150);
		submarineHatch.originalY = 40;
		sceneRef.add(submarineHatch);
		objects.push(submarineHatch);

		var doorsGeom = new THREE.BoxGeometry(40, 60, 4);
		var doorMat = new THREE.MeshLambertMaterial({color: 0x555555});
		var door1 = new THREE.Mesh(doorsGeom, doorMat);
		door1.position.set(-230, 40, 150);
		sceneRef.add(door1);
		objects.push(door1);

		var door2 = new THREE.Mesh(doorsGeom, doorMat);
		door2.position.set(-170, 40, 150);
		sceneRef.add(door2);
		objects.push(door2);

		var platformGeom = new THREE.BoxGeometry(140, 10, 160);
		var platformMat = new THREE.MeshLambertMaterial({color: 0x696969});
		var platform = new THREE.Mesh(platformGeom, platformMat);
		platform.position.set(-200, 15, 150);
		sceneRef.add(platform);
		objects.push(platform);
	}

	function buildIceCaverns() {
		var caveGeom = new THREE.BoxGeometry(200, 100, 100);
		var caveMat = new THREE.MeshLambertMaterial({color: 0x87CEEB});
		var cave1 = new THREE.Mesh(caveGeom, caveMat);
		cave1.position.set(-250, 50, 0);
		sceneRef.add(cave1);
		objects.push(cave1);

		var tunnelGeom = new THREE.CylinderGeometry(60, 60, 200, 8);
		var tunnelMat = new THREE.MeshLambertMaterial({color: 0xA0D8E8});
		var tunnel1 = new THREE.Mesh(tunnelGeom, tunnelMat);
		tunnel1.rotation.z = Math.PI * 0.5;
		tunnel1.position.set(-250, 50, 80);
		sceneRef.add(tunnel1);
		objects.push(tunnel1);

		var icicleGeom = new THREE.ConeGeometry(8, 60, 6);
		var icicleMat = new THREE.MeshLambertMaterial({color: 0xE0F8FF});
		for (var i = 0; i < 12; i++) {
			var icicle = new THREE.Mesh(icicleGeom, icicleMat);
			icicle.position.set(-200 + i * 8, 95, 0);
			sceneRef.add(icicle);
			objects.push(icicle);
		}
	}

	function buildSupplyShips() {
		var hullGeom = new THREE.BoxGeometry(50, 25, 120);
		var hullMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
		var supplyShip1 = new THREE.Mesh(hullGeom, hullMat);
		supplyShip1.position.set(-150, 12, -50);
		sceneRef.add(supplyShip1);
		objects.push(supplyShip1);

		var containerGeom = new THREE.BoxGeometry(40, 35, 40);
		var containerMat = new THREE.MeshLambertMaterial({color: 0xFF6347});
		var container1 = new THREE.Mesh(containerGeom, containerMat);
		container1.position.set(-150, 45, -50);
		sceneRef.add(container1);
		objects.push(container1);

		var container2 = new THREE.Mesh(containerGeom, containerMat);
		container2.position.set(-150, 45, -20);
		sceneRef.add(container2);
		objects.push(container2);

		var bridgeGeom = new THREE.BoxGeometry(30, 30, 30);
		var bridgeMat = new THREE.MeshLambertMaterial({color: 0x505050});
		var bridge1 = new THREE.Mesh(bridgeGeom, bridgeMat);
		bridge1.position.set(-150, 55, -50);
		sceneRef.add(bridge1);
		objects.push(bridge1);

		var smokeGeom = new THREE.CylinderGeometry(8, 8, 50, 6);
		var smokeMat = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
		var smoke1 = new THREE.Mesh(smokeGeom, smokeMat);
		smoke1.position.set(-150, 85, -50);
		sceneRef.add(smoke1);
		objects.push(smoke1);

		var supplyShip2 = new THREE.Mesh(hullGeom, hullMat);
		supplyShip2.position.set(50, 12, 180);
		sceneRef.add(supplyShip2);
		objects.push(supplyShip2);

		var container3 = new THREE.Mesh(containerGeom, containerMat);
		container3.position.set(50, 45, 180);
		sceneRef.add(container3);
		objects.push(container3);

		var bridge2 = new THREE.Mesh(bridgeGeom, bridgeMat);
		bridge2.position.set(50, 55, 180);
		sceneRef.add(bridge2);
		objects.push(bridge2);
	}

	function buildEnvironmentDetails() {
		var iceChunkGeom = new THREE.SphereGeometry(15, 4, 4);
		var iceChunkMat = new THREE.MeshLambertMaterial({color: 0xE8F4F8});
		for (var i = 0; i < 8; i++) {
			var chunk = new THREE.Mesh(iceChunkGeom, iceChunkMat);
			chunk.position.x = -200 + Math.random() * 400;
			chunk.position.y = Math.random() * 30;
			chunk.position.z = -200 + Math.random() * 400;
			chunk.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 0.5,
				(Math.random() - 0.5) * 0.3,
				(Math.random() - 0.5) * 0.5
			);
			chunk.originalY = chunk.position.y;
			sceneRef.add(chunk);
			objects.push(chunk);
			iceChunks.push(chunk);
		}

		var barrelGeom = new THREE.CylinderGeometry(8, 8, 25, 8);
		var barrelMat = new THREE.MeshLambertMaterial({color: 0xFF8C00});
		for (var i = 0; i < 6; i++) {
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.position.set(-100 + i * 30, 15, 50);
			sceneRef.add(barrel);
			objects.push(barrel);
		}

		var boxGeom = new THREE.BoxGeometry(20, 20, 20);
		var boxMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
		for (var i = 0; i < 4; i++) {
			var box = new THREE.Mesh(boxGeom, boxMat);
			box.position.set(150 + i * 25, 15, 120);
			sceneRef.add(box);
			objects.push(box);
		}

		var cratePileGeom = new THREE.BoxGeometry(40, 80, 40);
		var crateMat = new THREE.MeshLambertMaterial({color: 0xA0522D});
		var cratePile = new THREE.Mesh(cratePileGeom, crateMat);
		cratePile.position.set(-180, 40, 0);
		sceneRef.add(cratePile);
		objects.push(cratePile);

		var sphereGeom = new THREE.SphereGeometry(10, 8, 8);
		var sphereMat = new THREE.MeshLambertMaterial({color: 0x696969});
		var sphere1 = new THREE.Mesh(sphereGeom, sphereMat);
		sphere1.position.set(200, 20, 100);
		sceneRef.add(sphere1);
		objects.push(sphere1);

		var sphere2 = new THREE.Mesh(sphereGeom, sphereMat);
		sphere2.position.set(220, 20, 100);
		sceneRef.add(sphere2);
		objects.push(sphere2);

		var radGeom = new THREE.CylinderGeometry(5, 5, 60, 6);
		var radMat = new THREE.MeshLambertMaterial({color: 0xFFD700});
		var radiator1 = new THREE.Mesh(radGeom, radMat);
		radiator1.position.set(0, 30, -180);
		sceneRef.add(radiator1);
		objects.push(radiator1);

		var radiator2 = new THREE.Mesh(radGeom, radMat);
		radiator2.position.set(80, 30, -180);
		sceneRef.add(radiator2);
		objects.push(radiator2);

		var guardRailGeom = new THREE.BoxGeometry(3, 15, 150);
		var guardMat = new THREE.MeshLambertMaterial({color: 0xFF0000});
		var guard1 = new THREE.Mesh(guardRailGeom, guardMat);
		guard1.position.set(-160, 20, 0);
		sceneRef.add(guard1);
		objects.push(guard1);

		var guard2 = new THREE.Mesh(guardRailGeom, guardMat);
		guard2.position.set(60, 20, 0);
		sceneRef.add(guard2);
		objects.push(guard2);
	}

	function setupLights() {
		var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
		sceneRef.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
		directionalLight.position.set(150, 200, 100);
		sceneRef.add(directionalLight);
		lights.push(directionalLight);

		var directionalLight2 = new THREE.DirectionalLight(0xB0E0FF, 0.4);
		directionalLight2.position.set(-150, 150, -200);
		sceneRef.add(directionalLight2);
		lights.push(directionalLight2);

		var pointLight = new THREE.PointLight(0xFFFFFF, 0.5, 300);
		pointLight.position.set(0, 100, 0);
		sceneRef.add(pointLight);
		lights.push(pointLight);

		var pointLight2 = new THREE.PointLight(0x6495ED, 0.3, 250);
		pointLight2.position.set(-200, 80, 150);
		sceneRef.add(pointLight2);
		lights.push(pointLight2);
	}

	function update(delta) {
		if (craneArm) {
			craneRotation += delta * 0.3;
			var angle = Math.sin(craneRotation) * 0.5;
			craneArm.rotation.y = angle;
		}

		if (submarineHatch) {
			hatchOpening += delta * 0.5;
			var hatchAngle = Math.sin(hatchOpening) * 0.4;
			submarineHatch.rotation.x = hatchAngle;
		}

		for (var i = 0; i < iceChunks.length; i++) {
			var chunk = iceChunks[i];
			chunk.position.y = chunk.originalY + Math.sin(Date.now() * 0.001 + i) * 10;
			chunk.rotation.x += delta * 0.3;
			chunk.rotation.z += delta * 0.2;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			sceneRef.remove(objects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			sceneRef.remove(lights[i]);
		}
		objects = [];
		lights = [];
		iceChunks = [];
		craneArm = null;
		submarineHatch = null;
		sceneRef = null;
		cameraRef = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
