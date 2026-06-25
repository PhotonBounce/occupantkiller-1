window.FrozenDock = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var particles = [];
	var lights = [];
	var structures = [];
	var animationTime = 0;

	function createSnowParticles() {
		var particleGroup = new THREE.Group();
		var particleCount = 300;

		var geometry = new THREE.BufferGeometry();
		var positions = new Float32Array(particleCount * 3);
		var velocities = new Float32Array(particleCount * 3);

		for (var i = 0; i < particleCount; i++) {
			positions[i * 3] = Math.random() * 100 - 50;
			positions[i * 3 + 1] = Math.random() * 80;
			positions[i * 3 + 2] = Math.random() * 100 - 50;

			velocities[i * 3] = (Math.random() - 0.5) * 0.2;
			velocities[i * 3 + 1] = -Math.random() * 0.3 - 0.1;
			velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		var material = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 0.3,
			transparent: true,
			opacity: 0.6
		});

		var snow = new THREE.Points(geometry, material);
		particleGroup.add(snow);

		return {
			group: particleGroup,
			positions: positions,
			velocities: velocities,
			geometry: geometry,
			particleCount: particleCount
		};
	}

	function createDockLights() {
		var lightsArray = [];

		var light1 = new THREE.PointLight(0x4488ff, 1.5, 60);
		light1.position.set(-30, 20, -20);
		light1.userData.originalIntensity = 1.5;
		light1.userData.flickerSpeed = 0.05;
		scene.add(light1);
		lightsArray.push(light1);

		var light2 = new THREE.PointLight(0x4488ff, 1.2, 50);
		light2.position.set(25, 18, 10);
		light2.userData.originalIntensity = 1.2;
		light2.userData.flickerSpeed = 0.07;
		scene.add(light2);
		lightsArray.push(light2);

		var light3 = new THREE.PointLight(0x6699ff, 1.0, 40);
		light3.position.set(-10, 25, 35);
		light3.userData.originalIntensity = 1.0;
		light3.userData.flickerSpeed = 0.06;
		scene.add(light3);
		lightsArray.push(light3);

		var ambientLight = new THREE.AmbientLight(0x7799cc, 0.5);
		scene.add(ambientLight);
		lightsArray.push(ambientLight);

		return lightsArray;
	}

	function createMaterial(color) {
		return new THREE.MeshPhongMaterial({
			color: color,
			shininess: 20,
			emissive: 0x111111
		});
	}

	function createIceWalls() {
		var groupName = 'iceWalls';
		var materialIce = createMaterial(0x88ccff);

		var wall1 = new THREE.Mesh(
			new THREE.BoxGeometry(60, 5, 2),
			materialIce
		);
		wall1.position.set(0, 2.5, -40);
		wall1.castShadow = true;
		wall1.receiveShadow = true;
		scene.add(wall1);
		structures.push(wall1);

		var wall2 = new THREE.Mesh(
			new THREE.BoxGeometry(2, 6, 50),
			materialIce
		);
		wall2.position.set(-40, 3, 0);
		wall2.castShadow = true;
		wall2.receiveShadow = true;
		scene.add(wall2);
		structures.push(wall2);

		var wall3 = new THREE.Mesh(
			new THREE.BoxGeometry(2, 6, 50),
			materialIce
		);
		wall3.position.set(40, 3, 0);
		wall3.castShadow = true;
		wall3.receiveShadow = true;
		scene.add(wall3);
		structures.push(wall3);
	}

	function createFrozenShips() {
		var materialHull = createMaterial(0xaa3333);
		var materialIce = createMaterial(0x88ccff);

		var hull1 = new THREE.Mesh(
			new THREE.BoxGeometry(30, 8, 12),
			materialHull
		);
		hull1.position.set(-20, 4, 10);
		hull1.castShadow = true;
		hull1.receiveShadow = true;
		scene.add(hull1);
		structures.push(hull1);

		var superstructure1 = new THREE.Mesh(
			new THREE.BoxGeometry(8, 10, 8),
			materialHull
		);
		superstructure1.position.set(-18, 12, 12);
		superstructure1.castShadow = true;
		superstructure1.receiveShadow = true;
		scene.add(superstructure1);
		structures.push(superstructure1);

		var hull2 = new THREE.Mesh(
			new THREE.BoxGeometry(25, 7, 10),
			materialHull
		);
		hull2.position.set(18, 3.5, -5);
		hull2.castShadow = true;
		hull2.receiveShadow = true;
		scene.add(hull2);
		structures.push(hull2);

		var superstructure2 = new THREE.Mesh(
			new THREE.BoxGeometry(6, 9, 6),
			materialHull
		);
		superstructure2.position.set(16, 11, -4);
		superstructure2.castShadow = true;
		superstructure2.receiveShadow = true;
		scene.add(superstructure2);
		structures.push(superstructure2);

		var iceCrust1 = new THREE.Mesh(
			new THREE.BoxGeometry(32, 2, 14),
			materialIce
		);
		iceCrust1.position.set(-20, 8.5, 10);
		iceCrust1.castShadow = true;
		iceCrust1.receiveShadow = true;
		scene.add(iceCrust1);
		structures.push(iceCrust1);

		var iceCrust2 = new THREE.Mesh(
			new THREE.BoxGeometry(27, 1.5, 12),
			materialIce
		);
		iceCrust2.position.set(18, 7.5, -5);
		iceCrust2.castShadow = true;
		iceCrust2.receiveShadow = true;
		scene.add(iceCrust2);
		structures.push(iceCrust2);
	}

	function createIcebreaker() {
		var materialHull = createMaterial(0x1a1a4d);

		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(35, 6, 10),
			materialHull
		);
		hull.position.set(0, 3, 25);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);
		structures.push(hull);

		var bridge = new THREE.Mesh(
			new THREE.BoxGeometry(10, 12, 8),
			materialHull
		);
		bridge.position.set(-8, 13, 26);
		bridge.castShadow = true;
		bridge.receiveShadow = true;
		scene.add(bridge);
		structures.push(bridge);

		var smokeStack = new THREE.Mesh(
			new THREE.CylinderGeometry(2, 2.2, 15, 16),
			createMaterial(0x444444)
		);
		smokeStack.position.set(-6, 20, 28);
		smokeStack.castShadow = true;
		smokeStack.receiveShadow = true;
		scene.add(smokeStack);
		structures.push(smokeStack);
	}

	function createDocks() {
		var materialWood = createMaterial(0x8b6914);
		var materialConcrete = createMaterial(0x555555);

		var pier1 = new THREE.Mesh(
			new THREE.BoxGeometry(50, 3, 6),
			materialConcrete
		);
		pier1.position.set(0, 1.5, -18);
		pier1.castShadow = true;
		pier1.receiveShadow = true;
		scene.add(pier1);
		structures.push(pier1);

		var pier2 = new THREE.Mesh(
			new THREE.BoxGeometry(8, 2, 40),
			materialConcrete
		);
		pier2.position.set(-25, 1, 5);
		pier2.castShadow = true;
		pier2.receiveShadow = true;
		scene.add(pier2);
		structures.push(pier2);

		var piling1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.8, 1, 8, 8),
			materialWood
		);
		piling1.position.set(-15, 4, -15);
		piling1.castShadow = true;
		piling1.receiveShadow = true;
		scene.add(piling1);
		structures.push(piling1);

		var piling2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.8, 1, 8, 8),
			materialWood
		);
		piling2.position.set(15, 4, -15);
		piling2.castShadow = true;
		piling2.receiveShadow = true;
		scene.add(piling2);
		structures.push(piling2);
	}

	function createCargoContainers() {
		var colors = [0xff4444, 0x44ff44, 0x4444ff];
		var materialContainer;

		for (var i = 0; i < 4; i++) {
			materialContainer = createMaterial(colors[i % colors.length]);

			var container = new THREE.Mesh(
				new THREE.BoxGeometry(8, 8, 6),
				materialContainer
			);
			container.position.set(-25 + i * 10, 4, 18);
			container.castShadow = true;
			container.receiveShadow = true;
			scene.add(container);
			structures.push(container);
		}
	}

	function createWarehouse() {
		var materialMetal = createMaterial(0x666666);
		var materialRoof = createMaterial(0x333333);

		var mainStructure = new THREE.Mesh(
			new THREE.BoxGeometry(40, 16, 30),
			materialMetal
		);
		mainStructure.position.set(35, 8, -10);
		mainStructure.castShadow = true;
		mainStructure.receiveShadow = true;
		scene.add(mainStructure);
		structures.push(mainStructure);

		var roof = new THREE.Mesh(
			new THREE.BoxGeometry(42, 2, 32),
			materialRoof
		);
		roof.position.set(35, 17, -10);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
		structures.push(roof);

		var door = new THREE.Mesh(
			new THREE.BoxGeometry(6, 12, 1),
			createMaterial(0x1a1a1a)
		);
		door.position.set(55, 6, 5);
		door.castShadow = true;
		door.receiveShadow = true;
		scene.add(door);
		structures.push(door);
	}

	function createFuelTanks() {
		var materialTank = createMaterial(0xffaa00);

		var tank1 = new THREE.Mesh(
			new THREE.CylinderGeometry(4, 4, 12, 16),
			materialTank
		);
		tank1.position.set(-35, 6, 30);
		tank1.castShadow = true;
		tank1.receiveShadow = true;
		scene.add(tank1);
		structures.push(tank1);

		var tank2 = new THREE.Mesh(
			new THREE.CylinderGeometry(3.5, 3.5, 10, 16),
			materialTank
		);
		tank2.position.set(-25, 5, 28);
		tank2.castShadow = true;
		tank2.receiveShadow = true;
		scene.add(tank2);
		structures.push(tank2);

		var supportRing1 = new THREE.Mesh(
			new THREE.CylinderGeometry(4.5, 4.5, 0.8, 16),
			createMaterial(0x444444)
		);
		supportRing1.position.set(-35, 11, 30);
		scene.add(supportRing1);
		structures.push(supportRing1);

		var supportRing2 = new THREE.Mesh(
			new THREE.CylinderGeometry(4, 4, 0.8, 16),
			createMaterial(0x444444)
		);
		supportRing2.position.set(-25, 9, 28);
		scene.add(supportRing2);
		structures.push(supportRing2);
	}

	function createRadarStation() {
		var materialRadar = createMaterial(0xcccccc);
		var materialSupport = createMaterial(0x666666);

		var tower = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1.5, 18, 12),
			materialSupport
		);
		tower.position.set(30, 9, -35);
		tower.castShadow = true;
		tower.receiveShadow = true;
		scene.add(tower);
		structures.push(tower);

		var dish = new THREE.Mesh(
			new THREE.CylinderGeometry(6, 6, 0.8, 32),
			materialRadar
		);
		dish.position.set(30, 22, -35);
		dish.castShadow = true;
		dish.receiveShadow = true;
		scene.add(dish);
		structures.push(dish);

		var radarSupport = new THREE.Mesh(
			new THREE.CylinderGeometry(0.6, 0.6, 5, 8),
			materialSupport
		);
		radarSupport.position.set(30, 20, -35);
		scene.add(radarSupport);
		structures.push(radarSupport);
	}

	function createCatwalks() {
		var materialCatwalk = createMaterial(0x777777);

		var catwalk1 = new THREE.Mesh(
			new THREE.BoxGeometry(20, 1, 2),
			materialCatwalk
		);
		catwalk1.position.set(-10, 12, 0);
		catwalk1.castShadow = true;
		catwalk1.receiveShadow = true;
		scene.add(catwalk1);
		structures.push(catwalk1);

		var railing1a = new THREE.Mesh(
			new THREE.BoxGeometry(20, 2, 0.4),
			materialCatwalk
		);
		railing1a.position.set(-10, 13.2, 1.3);
		scene.add(railing1a);
		structures.push(railing1a);

		var railing1b = new THREE.Mesh(
			new THREE.BoxGeometry(20, 2, 0.4),
			materialCatwalk
		);
		railing1b.position.set(-10, 13.2, -1.3);
		scene.add(railing1b);
		structures.push(railing1b);

		var catwalk2 = new THREE.Mesh(
			new THREE.BoxGeometry(3, 1, 15),
			materialCatwalk
		);
		catwalk2.position.set(20, 10, 5);
		catwalk2.castShadow = true;
		catwalk2.receiveShadow = true;
		scene.add(catwalk2);
		structures.push(catwalk2);
	}

	function createSnowmobiles() {
		var materialVehicle = createMaterial(0x1a1a1a);
		var materialMetal = createMaterial(0xaaaaaa);

		var snowmobile1Body = new THREE.Mesh(
			new THREE.BoxGeometry(6, 2.5, 3),
			materialVehicle
		);
		snowmobile1Body.position.set(-20, 1.25, -25);
		snowmobile1Body.castShadow = true;
		snowmobile1Body.receiveShadow = true;
		scene.add(snowmobile1Body);
		structures.push(snowmobile1Body);

		var snowmobile1Seat = new THREE.Mesh(
			new THREE.BoxGeometry(2, 1, 1.5),
			materialMetal
		);
		snowmobile1Seat.position.set(-16, 2.5, -25);
		scene.add(snowmobile1Seat);
		structures.push(snowmobile1Seat);

		var snowmobile2Body = new THREE.Mesh(
			new THREE.BoxGeometry(6, 2.5, 3),
			materialVehicle
		);
		snowmobile2Body.position.set(25, 1.25, 20);
		snowmobile2Body.castShadow = true;
		snowmobile2Body.receiveShadow = true;
		scene.add(snowmobile2Body);
		structures.push(snowmobile2Body);

		var snowmobile2Seat = new THREE.Mesh(
			new THREE.BoxGeometry(2, 1, 1.5),
			materialMetal
		);
		snowmobile2Seat.position.set(29, 2.5, 20);
		scene.add(snowmobile2Seat);
		structures.push(snowmobile2Seat);
	}

	function createIceFloes() {
		var materialIce = createMaterial(0x99ddff);

		for (var i = 0; i < 6; i++) {
			var floe = new THREE.Mesh(
				new THREE.BoxGeometry(8 + Math.random() * 8, 1 + Math.random() * 2, 6 + Math.random() * 6),
				materialIce
			);
			floe.position.set(-40 + Math.random() * 80, 0.2 + Math.random() * 0.5, -40 + Math.random() * 80);
			floe.rotation.z = Math.random() * 0.5;
			floe.castShadow = true;
			floe.receiveShadow = true;
			scene.add(floe);
			structures.push(floe);
		}
	}

	function createCranes() {
		var materialSteel = createMaterial(0x555555);

		var craneBase = new THREE.Mesh(
			new THREE.BoxGeometry(4, 15, 4),
			materialSteel
		);
		craneBase.position.set(-35, 7.5, -12);
		craneBase.castShadow = true;
		craneBase.receiveShadow = true;
		scene.add(craneBase);
		structures.push(craneBase);

		var craneBoom = new THREE.Mesh(
			new THREE.BoxGeometry(30, 1.5, 1.5),
			materialSteel
		);
		craneBoom.position.set(-20, 17, -12);
		craneBoom.rotation.z = 0.2;
		craneBoom.castShadow = true;
		craneBoom.receiveShadow = true;
		scene.add(craneBoom);
		structures.push(craneBoom);

		var craneHook = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1, 3, 8),
			createMaterial(0xffaa00)
		);
		craneHook.position.set(-8, 12, -12);
		scene.add(craneHook);
		structures.push(craneHook);
	}

	function createGroundPlane() {
		var materialSnow = createMaterial(0xffffff);
		var groundPlane = new THREE.Mesh(
			new THREE.BoxGeometry(100, 0.2, 100),
			materialSnow
		);
		groundPlane.position.set(0, 0, 0);
		groundPlane.receiveShadow = true;
		scene.add(groundPlane);
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		scene.background = new THREE.Color(0x1a2a4a);
		scene.fog = new THREE.Fog(0x1a2a4a, 120, 180);

		createGroundPlane();
		createIceWalls();
		createFrozenShips();
		createIcebreaker();
		createDocks();
		createCargoContainers();
		createWarehouse();
		createFuelTanks();
		createRadarStation();
		createCatwalks();
		createSnowmobiles();
		createIceFloes();
		createCranes();

		lights = createDockLights();

		var snowData = createSnowParticles();
		scene.add(snowData.group);
		particles.push(snowData);

		animationTime = 0;
	}

	function update(delta) {
		animationTime += delta;

		for (var p = 0; p < particles.length; p++) {
			var particleData = particles[p];
			var positions = particleData.positions;
			var velocities = particleData.velocities;

			for (var i = 0; i < particleData.particleCount; i++) {
				positions[i * 3] += velocities[i * 3];
				positions[i * 3 + 1] += velocities[i * 3 + 1];
				positions[i * 3 + 2] += velocities[i * 3 + 2];

				if (positions[i * 3 + 1] < -5) {
					positions[i * 3 + 1] = 80;
				}

				if (positions[i * 3] < -60) {
					positions[i * 3] = 60;
				}
				if (positions[i * 3] > 60) {
					positions[i * 3] = -60;
				}

				if (positions[i * 3 + 2] < -60) {
					positions[i * 3 + 2] = 60;
				}
				if (positions[i * 3 + 2] > 60) {
					positions[i * 3 + 2] = -60;
				}
			}

			particleData.geometry.attributes.position.needsUpdate = true;
		}

		for (var l = 0; l < lights.length; l++) {
			var light = lights[l];
			if (light.userData.originalIntensity !== undefined) {
				var flicker = Math.sin(animationTime * light.userData.flickerSpeed * 10) * 0.15;
				light.intensity = light.userData.originalIntensity + flicker;
			}
		}

		for (var s = 0; s < structures.length; s++) {
			var structure = structures[s];
			if (Math.random() < 0.02) {
				structure.rotation.x += (Math.random() - 0.5) * 0.0005;
				structure.rotation.z += (Math.random() - 0.5) * 0.0005;
			}
		}
	}

	function reset() {
		if (scene) {
			for (var i = structures.length - 1; i >= 0; i--) {
				scene.remove(structures[i]);
			}
		}

		if (scene) {
			for (var j = particles.length - 1; j >= 0; j--) {
				scene.remove(particles[j].group);
			}
		}

		particles = [];
		structures = [];
		lights = [];
		animationTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
