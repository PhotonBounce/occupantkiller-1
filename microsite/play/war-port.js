var WarPort = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lightHouse = null;
	var crane = null;
	var waterSurface = null;
	var waveTime = 0;
	var craneTime = 0;

	function createMaterial(color) {
		var material = new THREE.MeshStandardMaterial({
			color: color,
			roughness: 0.7,
			metalness: 0.2
		});
		return material;
	}

	function addToScene(mesh) {
		objects.push(mesh);
		scene.add(mesh);
	}

	function createBuilding(x, y, z, width, height, depth, color) {
		var geometry = new THREE.BoxGeometry(width, height, depth);
		var material = createMaterial(color);
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y + height / 2, z);
		addToScene(mesh);
		return mesh;
	}

	function createMilitaryVehicle(x, y, z) {
		var vehicle = new THREE.Group();

		var bodyGeom = new THREE.BoxGeometry(4, 2.5, 2);
		var bodyMat = createMaterial(0x2d5016);
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.y = 1.5;
		vehicle.add(body);

		var cabinGeom = new THREE.BoxGeometry(2, 2, 2);
		var cabin = new THREE.Mesh(cabinGeom, bodyMat);
		cabin.position.set(1.5, 3, 0);
		vehicle.add(cabin);

		var wheelMat = createMaterial(0x1a1a1a);
		for (var i = 0; i < 4; i++) {
			var wheelX = -1 + (i % 2) * 2.5;
			var wheelZ = -1 + Math.floor(i / 2) * 2;
			var wheelGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
			var wheel = new THREE.Mesh(wheelGeom, wheelMat);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(wheelX, 0.8, wheelZ);
			vehicle.add(wheel);
		}

		vehicle.position.set(x, y, z);
		addToScene(vehicle);
		return vehicle;
	}

	function createArtilleryGun(x, y, z) {
		var gun = new THREE.Group();

		var platformGeom = new THREE.BoxGeometry(3, 0.5, 3);
		var platformMat = createMaterial(0x2d5016);
		var platform = new THREE.Mesh(platformGeom, platformMat);
		gun.add(platform);

		var baseGeom = new THREE.CylinderGeometry(1, 1, 0.3, 16);
		var base = new THREE.Mesh(baseGeom, platformMat);
		base.position.y = 0.3;
		gun.add(base);

		var barrelGeom = new THREE.CylinderGeometry(0.25, 0.25, 4, 16);
		var barrelMat = createMaterial(0x1a1a1a);
		var barrel = new THREE.Mesh(barrelGeom, barrelMat);
		barrel.rotation.z = Math.PI / 6;
		barrel.position.set(0, 0.8, 1);
		gun.add(barrel);

		gun.position.set(x, y, z);
		addToScene(gun);
		return gun;
	}

	function createExplosionDamage(x, y, z) {
		var damageGroup = new THREE.Group();

		var buildingGeom = new THREE.BoxGeometry(6, 8, 6);
		var buildingMat = createMaterial(0xc4a878);
		var building = new THREE.Mesh(buildingGeom, buildingMat);
		building.position.y = 4;
		damageGroup.add(building);

		for (var i = 0; i < 8; i++) {
			var crackX = (Math.random() - 0.5) * 6;
			var crackY = Math.random() * 8;
			var crackZ = (Math.random() - 0.5) * 6;
			var crackGeom = new THREE.BoxGeometry(0.3, 1.5, 0.3);
			var crackMat = createMaterial(0x3d3d3d);
			var crack = new THREE.Mesh(crackGeom, crackMat);
			crack.position.set(crackX, crackY, crackZ);
			damageGroup.add(crack);
		}

		damageGroup.position.set(x, y, z);
		addToScene(damageGroup);
		return damageGroup;
	}

	function createLighthouse() {
		var lighthouse = new THREE.Group();

		var baseGeom = new THREE.CylinderGeometry(3, 4, 2, 32);
		var baseMat = createMaterial(0xffffff);
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.position.y = 1;
		lighthouse.add(base);

		var towerGeom = new THREE.CylinderGeometry(2, 2.2, 16, 32);
		var tower = new THREE.Mesh(towerGeom, baseMat);
		tower.position.y = 10;
		lighthouse.add(tower);

		var roofGeom = new THREE.ConeGeometry(2.2, 3, 32);
		var roofMat = createMaterial(0xc41e3a);
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.y = 19.5;
		lighthouse.add(roof);

		var beaconGeom = new THREE.SphereGeometry(1, 32, 32);
		var beaconMat = createMaterial(0xffff00);
		var beacon = new THREE.Mesh(beaconGeom, beaconMat);
		beacon.position.y = 22;
		beacon.name = 'beacon';
		lighthouse.add(beacon);

		var lanternGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 32);
		var lanternMat = createMaterial(0xffa500);
		var lantern = new THREE.Mesh(lanternGeom, lanternMat);
		lantern.position.y = 21;
		lighthouse.add(lantern);

		lighthouse.position.set(35, 0, 35);
		addToScene(lighthouse);
		return lighthouse;
	}

	function createHarborCrane() {
		var crane = new THREE.Group();

		var baseGeom = new THREE.BoxGeometry(2, 1, 2);
		var baseMat = createMaterial(0x1a1a1a);
		var base = new THREE.Mesh(baseGeom, baseMat);
		crane.add(base);

		var towerGeom = new THREE.CylinderGeometry(0.4, 0.4, 18, 16);
		var towerMat = createMaterial(0x2d2d2d);
		var tower = new THREE.Mesh(towerGeom, towerMat);
		tower.position.y = 9;
		crane.add(tower);

		var jibGeom = new THREE.BoxGeometry(20, 0.4, 0.4);
		var jibMat = createMaterial(0x2d2d2d);
		var jib = new THREE.Mesh(jibGeom, jibMat);
		jib.position.set(10, 18, 0);
		jib.name = 'jib';
		crane.add(jib);

		var trolleyGeom = new THREE.BoxGeometry(1.5, 0.8, 1.5);
		var trolley = new THREE.Mesh(trolleyGeom, baseMat);
		trolley.position.y = 17.5;
		trolley.name = 'trolley';
		crane.add(trolley);

		var hookGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 16);
		var hookMat = createMaterial(0xffa500);
		var hook = new THREE.Mesh(hookGeom, hookMat);
		hook.position.set(0, 15.5, 0);
		crane.add(hook);

		crane.position.set(-30, 0, 15);
		addToScene(crane);
		return crane;
	}

	function createWaterSurface() {
		var waterGeom = new THREE.BoxGeometry(45, 0.5, 35);
		var waterMat = createMaterial(0x1e90ff);
		waterMat.transparent = true;
		waterMat.opacity = 0.6;
		var water = new THREE.Mesh(waterGeom, waterMat);
		water.position.set(-25, 0.2, 0);
		water.name = 'watersurface';
		addToScene(water);
		return water;
	}

	function createSupplyShip(x, y, z) {
		var ship = new THREE.Group();

		var hullGeom = new THREE.BoxGeometry(12, 4, 5);
		var hullMat = createMaterial(0x8b4513);
		var hull = new THREE.Mesh(hullGeom, hullMat);
		hull.position.y = 2;
		ship.add(hull);

		var superstructureGeom = new THREE.BoxGeometry(4, 3, 3);
		var structMat = createMaterial(0xc41e3a);
		var superstructure = new THREE.Mesh(superstructureGeom, structMat);
		superstructure.position.set(3, 4.5, 0);
		ship.add(superstructure);

		var crateColor = [0xffd700, 0xffa500, 0xd2691e];
		for (var i = 0; i < 12; i++) {
			var crateGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
			var crateMat = createMaterial(crateColor[i % 3]);
			var crate = new THREE.Mesh(crateGeom, crateMat);
			var crateX = -4 + (i % 4) * 2;
			var crateY = 4 + Math.floor(i / 4) * 1.8;
			var crateZ = (Math.floor((i % 8) / 4) - 0.5) * 3;
			crate.position.set(crateX, crateY, crateZ);
			ship.add(crate);
		}

		var smokeStackGeom = new THREE.CylinderGeometry(0.6, 0.6, 4, 16);
		var smokeMat = createMaterial(0x333333);
		var smokeStack = new THREE.Mesh(smokeStackGeom, smokeMat);
		smokeStack.position.set(2.5, 7, 0);
		ship.add(smokeStack);

		ship.position.set(x, y, z);
		addToScene(ship);
		return ship;
	}

	function createCoastalBunker(x, y, z) {
		var bunker = new THREE.Group();

		var mainGeom = new THREE.BoxGeometry(8, 3, 8);
		var bunkerMat = createMaterial(0x696969);
		var main = new THREE.Mesh(mainGeom, bunkerMat);
		main.position.y = 1.5;
		bunker.add(main);

		var roofGeom = new THREE.BoxGeometry(8.5, 0.5, 8.5);
		var roofMat = createMaterial(0x556b2f);
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.y = 3;
		bunker.add(roof);

		var gunGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 16);
		var gunMat = createMaterial(0x1a1a1a);
		for (var i = 0; i < 2; i++) {
			var gun = new THREE.Mesh(gunGeom, gunMat);
			gun.rotation.z = Math.PI / 4;
			gun.position.set((i - 0.5) * 3, 2.5, 2.5);
			bunker.add(gun);
		}

		bunker.position.set(x, y, z);
		addToScene(bunker);
		return bunker;
	}

	function createCommandPost(x, y, z) {
		var post = new THREE.Group();

		var tentGeom = new THREE.ConeGeometry(6, 5, 8);
		var tentMat = createMaterial(0x556b2f);
		var tent = new THREE.Mesh(tentGeom, tentMat);
		tent.position.y = 2.5;
		post.add(tent);

		var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 5, 16);
		var poleMat = createMaterial(0x8b7355);
		var pole = new THREE.Mesh(poleGeom, poleMat);
		pole.position.y = 2.5;
		post.add(pole);

		var tableGeom = new THREE.BoxGeometry(4, 1, 2);
		var tableMat = createMaterial(0x654321);
		var table = new THREE.Mesh(tableGeom, tableMat);
		table.position.set(0, 1.5, 0);
		post.add(table);

		for (var i = 0; i < 4; i++) {
			var legGeom = new THREE.BoxGeometry(0.2, 1, 0.2);
			var leg = new THREE.Mesh(legGeom, tableMat);
			var legX = (i % 2) * 2 - 1;
			var legZ = Math.floor(i / 2) * 1 - 0.5;
			leg.position.set(legX, 0.5, legZ);
			post.add(leg);
		}

		var flagGeom = new THREE.BoxGeometry(1.5, 1, 0.1);
		var flagMat = createMaterial(0xc41e3a);
		var flag = new THREE.Mesh(flagGeom, flagMat);
		flag.position.set(0, 3.5, 1);
		post.add(flag);

		post.position.set(x, y, z);
		addToScene(post);
		return post;
	}

	function createWaterTower() {
		var tower = new THREE.Group();

		var tankGeom = new THREE.CylinderGeometry(2.5, 2.5, 3, 32);
		var tankMat = createMaterial(0x8b7355);
		var tank = new THREE.Mesh(tankGeom, tankMat);
		tank.position.y = 5;
		tower.add(tank);

		var legMat = createMaterial(0x696969);
		for (var i = 0; i < 4; i++) {
			var legGeom = new THREE.BoxGeometry(0.4, 5, 0.4);
			var leg = new THREE.Mesh(legGeom, legMat);
			var legX = (i % 2) * 1.8 - 0.9;
			var legZ = Math.floor(i / 2) * 1.8 - 0.9;
			leg.position.set(legX, 2.5, legZ);
			tower.add(leg);
		}

		tower.position.set(15, 0, -25);
		addToScene(tower);
		return tower;
	}

	function createAAGun(x, y, z) {
		var aagun = new THREE.Group();

		var mountGeom = new THREE.BoxGeometry(2, 1, 2);
		var mountMat = createMaterial(0x2d5016);
		var mount = new THREE.Mesh(mountGeom, mountMat);
		aagun.add(mount);

		var barrelGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
		var barrelMat = createMaterial(0x1a1a1a);
		for (var i = 0; i < 2; i++) {
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.rotation.z = Math.PI / 3 + i * 0.3;
			barrel.position.set((i - 0.5) * 0.8, 1.5, 0);
			aagun.add(barrel);
		}

		var radarGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
		var radarMat = createMaterial(0xffff00);
		var radar = new THREE.Mesh(radarGeom, radarMat);
		radar.position.set(0, 2.2, 0);
		aagun.add(radar);

		aagun.position.set(x, y, z);
		addToScene(aagun);
		return aagun;
	}

	function createDockStructure(x, y, z) {
		var dock = new THREE.Group();

		var platformGeom = new THREE.BoxGeometry(6, 0.5, 4);
		var platformMat = createMaterial(0x8b6914);
		var platform = new THREE.Mesh(platformGeom, platformMat);
		dock.add(platform);

		for (var i = 0; i < 3; i++) {
			var pilingGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 16);
			var pilingMat = createMaterial(0x654321);
			var piling = new THREE.Mesh(pilingGeom, pilingMat);
			piling.position.set(-2.5 + i * 2.5, -1.5, 0);
			dock.add(piling);
		}

		var crateColor = [0xffd700, 0xffa500, 0xd2691e];
		for (var j = 0; j < 15; j++) {
			var crateGeom = new THREE.BoxGeometry(1, 1, 1);
			var crateMat = createMaterial(crateColor[j % 3]);
			var crate = new THREE.Mesh(crateGeom, crateMat);
			var crateX = -2 + (j % 5) * 1.2;
			var crateY = 0.8 + Math.floor(j / 5) * 1.1;
			var crateZ = (Math.floor((j % 10) / 5) - 0.5) * 1.5;
			crate.position.set(crateX, crateY, crateZ);
			dock.add(crate);
		}

		dock.position.set(x, y, z);
		addToScene(dock);
		return dock;
	}

	function createMediterraneanBuilding(x, y, z, width, height, depth) {
		var building = new THREE.Group();

		var mainGeom = new THREE.BoxGeometry(width, height, depth);
		var mainMat = createMaterial(0xf5deb3);
		var main = new THREE.Mesh(mainGeom, mainMat);
		main.position.y = height / 2;
		building.add(main);

		var windowMat = createMaterial(0x87ceeb);
		var doorMat = createMaterial(0x8b4513);

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 2; j++) {
				var windowGeom = new THREE.BoxGeometry(0.8, 0.8, 0.1);
				var window = new THREE.Mesh(windowGeom, windowMat);
				var windowX = -width / 2 + 1.5 + i * (width / 2.5);
				var windowY = height / 3 + j * (height / 3);
				var windowZ = depth / 2 + 0.05;
				window.position.set(windowX, windowY, windowZ);
				building.add(window);
			}
		}

		var doorGeom = new THREE.BoxGeometry(0.8, 1.5, 0.1);
		var door = new THREE.Mesh(doorGeom, doorMat);
		door.position.set(-width / 2 + 1, 0.75, depth / 2 + 0.05);
		building.add(door);

		var roofGeom = new THREE.BoxGeometry(width + 0.5, 0.4, depth + 0.5);
		var roofMat = createMaterial(0xd2691e);
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.y = height + 0.2;
		building.add(roof);

		building.position.set(x, y, z);
		addToScene(building);
		return building;
	}

	function createHarborBasin() {
		var basinGeom = new THREE.BoxGeometry(45, 1.5, 35);
		var basinMat = createMaterial(0x4682b4);
		basinMat.transparent = true;
		basinMat.opacity = 0.4;
		var basin = new THREE.Mesh(basinGeom, basinMat);
		basin.position.set(-25, 0.8, 0);
		addToScene(basin);

		var seawallMat = createMaterial(0x696969);
		var seawallGeom = new THREE.BoxGeometry(1, 2, 35);
		var seawall1 = new THREE.Mesh(seawallGeom, seawallMat);
		seawall1.position.set(-43, 1, 0);
		addToScene(seawall1);

		var seawall2 = new THREE.Mesh(seawallGeom, seawallMat);
		seawall2.position.set(-7, 1, 0);
		addToScene(seawall2);

		var seawallEnd = new THREE.BoxGeometry(36, 2, 1);
		var seawallN = new THREE.Mesh(seawallEnd, seawallMat);
		seawallN.position.set(-25, 1, -17.5);
		addToScene(seawallN);

		var seawallS = new THREE.Mesh(seawallEnd, seawallMat);
		seawallS.position.set(-25, 1, 17.5);
		addToScene(seawallS);
	}

	function createStreetGrid() {
		var asphalt = createMaterial(0x2f4f4f);

		for (var i = 0; i < 8; i++) {
			var roadGeom = new THREE.BoxGeometry(50, 0.1, 3);
			var road = new THREE.Mesh(roadGeom, asphalt);
			road.position.set(10, 0.05, -30 + i * 9);
			addToScene(road);
		}

		for (var j = 0; j < 6; j++) {
			var roadGeom2 = new THREE.BoxGeometry(3, 0.1, 50);
			var road2 = new THREE.Mesh(roadGeom2, asphalt);
			road2.position.set(-20 + j * 12, 0.05, 10);
			addToScene(road2);
		}
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		waveTime = 0;
		craneTime = 0;

		createStreetGrid();
		createHarborBasin();

		waterSurface = createWaterSurface();

		createMediterraneanBuilding(-10, 0, -25, 8, 10, 8);
		createMediterraneanBuilding(-10, 0, -10, 8, 12, 8);
		createMediterraneanBuilding(-10, 0, 5, 8, 9, 8);
		createMediterraneanBuilding(-10, 0, 20, 8, 11, 8);

		createMediterraneanBuilding(0, 0, -25, 7, 11, 7);
		createMediterraneanBuilding(0, 0, -10, 7, 9, 7);
		createMediterraneanBuilding(0, 0, 5, 7, 12, 7);
		createMediterraneanBuilding(0, 0, 20, 7, 10, 7);

		createMediterraneanBuilding(15, 0, -25, 6, 10, 6);
		createMediterraneanBuilding(15, 0, -10, 6, 11, 6);
		createMediterraneanBuilding(15, 0, 5, 6, 9, 6);
		createMediterraneanBuilding(15, 0, 20, 6, 10, 6);

		createMediterraneanBuilding(30, 0, -25, 7, 9, 7);
		createMediterraneanBuilding(30, 0, -10, 7, 10, 7);
		createMediterraneanBuilding(30, 0, 5, 7, 11, 7);
		createMediterraneanBuilding(30, 0, 20, 7, 10, 7);

		createArtilleryGun(-8, 10.5, -25);
		createArtilleryGun(2, 12, -10);
		createArtilleryGun(15, 11, 5);
		createArtilleryGun(28, 10, 20);

		createAAGun(-10, 11, -23);
		createAAGun(2, 13, -8);
		createAAGun(17, 11, 7);
		createAAGun(32, 10.5, 22);

		createMilitaryVehicle(-5, 0, -30);
		createMilitaryVehicle(5, 0, -20);
		createMilitaryVehicle(20, 0, -15);
		createMilitaryVehicle(25, 0, 10);
		createMilitaryVehicle(-15, 0, 25);
		createMilitaryVehicle(10, 0, 28);

		createExplosionDamage(-20, 0, -18);
		createExplosionDamage(5, 0, 15);

		lightHouse = createLighthouse();

		crane = createHarborCrane();

		createSupplyShip(-35, 0.5, -5);
		createSupplyShip(-35, 0.5, 10);
		createSupplyShip(-40, 0.5, 25);

		createCoastalBunker(-45, 0, -15);
		createCoastalBunker(-45, 0, 15);

		createCommandPost(0, 0, 30);

		createWaterTower();

		createDockStructure(-35, 0, -15);
		createDockStructure(-32, 0, 0);
		createDockStructure(-35, 0, 30);

		createBuilding(20, 0, -30, 4, 6, 4, 0xdeb887);
		createBuilding(25, 0, -28, 4, 7, 4, 0xdaa520);
		createBuilding(22, 0, -22, 3, 5, 3, 0xd2b48c);

		createBuilding(-25, 0, -30, 5, 8, 5, 0xe6d5b8);
		createBuilding(-22, 0, -23, 4, 6, 4, 0xf5deb3);
		createBuilding(-28, 0, -25, 4, 7, 4, 0xf0e68c);

		createBuilding(35, 0, -15, 5, 9, 5, 0xf5f5dc);
		createBuilding(40, 0, -10, 4, 8, 4, 0xfffacd);
		createBuilding(38, 0, 0, 3, 6, 3, 0xf0e68c);

		createBuilding(-15, 0, 15, 6, 10, 6, 0xf5deb3);
		createBuilding(-8, 0, 18, 5, 8, 5, 0xdeb887);
		createBuilding(-12, 0, 25, 4, 7, 4, 0xdaa520);

		createBuilding(35, 0, 25, 5, 9, 5, 0xf5f5dc);
		createBuilding(40, 0, 28, 4, 8, 4, 0xfffacd);

		createMilitaryVehicle(-20, 0, 5);
		createMilitaryVehicle(8, 0, 15);

		for (var i = 0; i < 5; i++) {
			createBuilding(-35 + i * 3, 0, -30 + (i % 2) * 8, 2.5, 4 + (i % 3) * 2, 2.5, 0xd2b48c);
		}

		for (var j = 0; j < 4; j++) {
			createBuilding(42 + (j % 2) * 4, 0, -25 + j * 15, 3, 5 + (j % 3) * 2, 3, 0xdeb887);
		}
	}

	function update(delta) {
		waveTime += delta;
		craneTime += delta;

		if (lightHouse) {
			var beacon = lightHouse.getObjectByName('beacon');
			if (beacon) {
				beacon.rotation.y += delta * 3;
				var beaconIntensity = 0.5 + Math.sin(waveTime * 4) * 0.5;
				beacon.material.emissiveIntensity = beaconIntensity;
			}
		}

		if (crane) {
			var trolley = crane.getObjectByName('trolley');
			if (trolley) {
				var trolleyX = Math.sin(craneTime * 0.5) * 8;
				trolley.position.x = trolleyX;
			}
		}

		if (waterSurface) {
			var waveOffset = Math.sin(waveTime * 1.5) * 0.3;
			waterSurface.position.y = 0.2 + waveOffset;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];
		lightHouse = null;
		crane = null;
		waterSurface = null;
		waveTime = 0;
		craneTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
