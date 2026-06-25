var SkyBarge = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var elements = [];
	var time = 0;

	var enginePods = [];
	var craneArm = null;
	var deckLights = [];
	var chains = [];

	function createEnginePod(x, y, z) {
		var geometry = new THREE.SphereGeometry(2.5, 16, 16);
		var material = new THREE.MeshStandardMaterial({
			color: 0x00ff88,
			emissive: 0x00ff88,
			emissiveIntensity: 0.6,
			metalness: 0.8,
			roughness: 0.2
		});
		var pod = new THREE.Mesh(geometry, material);
		pod.position.set(x, y, z);
		pod.castShadow = true;
		pod.receiveShadow = true;
		scene.add(pod);
		elements.push(pod);
		enginePods.push({ mesh: pod, baseY: y, pulse: Math.random() * Math.PI * 2 });
		return pod;
	}

	function createCargoDeck() {
		var geometry = new THREE.BoxGeometry(80, 1, 40);
		var material = new THREE.MeshStandardMaterial({
			color: 0x4a4a4a,
			metalness: 0.5,
			roughness: 0.6
		});
		var deck = new THREE.Mesh(geometry, material);
		deck.position.set(0, 0, 0);
		deck.castShadow = true;
		deck.receiveShadow = true;
		scene.add(deck);
		elements.push(deck);
		return deck;
	}

	function createShippingContainer(x, y, z, sizeX, sizeY, sizeZ, colorHex) {
		var geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
		var material = new THREE.MeshStandardMaterial({
			color: colorHex,
			metalness: 0.3,
			roughness: 0.7
		});
		var container = new THREE.Mesh(geometry, material);
		container.position.set(x, y, z);
		container.castShadow = true;
		container.receiveShadow = true;
		scene.add(container);
		elements.push(container);
		return container;
	}

	function createFlightCabin() {
		var cabinGeometry = new THREE.BoxGeometry(12, 6, 8);
		var cabinMaterial = new THREE.MeshStandardMaterial({
			color: 0x2c3e50,
			metalness: 0.4,
			roughness: 0.6
		});
		var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
		cabin.position.set(-30, 5, 15);
		cabin.castShadow = true;
		cabin.receiveShadow = true;
		scene.add(cabin);
		elements.push(cabin);

		var roofGeometry = new THREE.BoxGeometry(14, 2, 10);
		var roofMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.6,
			roughness: 0.5
		});
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(-30, 9, 15);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
		elements.push(roof);

		return { cabin: cabin, roof: roof };
	}

	function createCargoCrane() {
		var baseGeometry = new THREE.CylinderGeometry(2, 2.5, 3, 8);
		var baseMaterial = new THREE.MeshStandardMaterial({
			color: 0xff8c00,
			metalness: 0.7,
			roughness: 0.3
		});
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(0, 2, -5);
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);
		elements.push(base);

		var columnGeometry = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
		var columnMaterial = new THREE.MeshStandardMaterial({
			color: 0xff8c00,
			metalness: 0.7,
			roughness: 0.3
		});
		var column = new THREE.Mesh(columnGeometry, columnMaterial);
		column.position.set(0, 12, -5);
		column.castShadow = true;
		column.receiveShadow = true;
		scene.add(column);
		elements.push(column);

		var armGeometry = new THREE.BoxGeometry(25, 1.5, 1.5);
		var armMaterial = new THREE.MeshStandardMaterial({
			color: 0xff8c00,
			metalness: 0.7,
			roughness: 0.3
		});
		craneArm = new THREE.Mesh(armGeometry, armMaterial);
		craneArm.position.set(5, 20, -5);
		craneArm.castShadow = true;
		craneArm.receiveShadow = true;
		scene.add(craneArm);
		elements.push(craneArm);

		return { base: base, column: column, arm: craneArm };
	}

	function createDefensiveTurret(x, y, z) {
		var baseGeometry = new THREE.CylinderGeometry(1.5, 2, 2, 8);
		var turretMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.8,
			roughness: 0.4
		});
		var base = new THREE.Mesh(baseGeometry, turretMaterial);
		base.position.set(x, y, z);
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);
		elements.push(base);

		var gunGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
		var gun = new THREE.Mesh(gunGeometry, turretMaterial);
		gun.position.set(x, y + 2, z);
		gun.rotation.z = Math.PI / 6;
		gun.castShadow = true;
		gun.receiveShadow = true;
		scene.add(gun);
		elements.push(gun);

		return { base: base, gun: gun };
	}

	function createMooringChain(x, z) {
		var chainGroup = new THREE.Group();
		var numLinks = 12;
		var linkSpacing = 4;
		var positions = [];

		for (var i = 0; i < numLinks; i++) {
			var linkGeometry = new THREE.BoxGeometry(0.3, linkSpacing, 0.3);
			var linkMaterial = new THREE.MeshStandardMaterial({
				color: 0x696969,
				metalness: 0.6,
				roughness: 0.5
			});
			var link = new THREE.Mesh(linkGeometry, linkMaterial);
			link.position.set(x, -i * linkSpacing, z);
			link.castShadow = true;
			link.receiveShadow = true;
			chainGroup.add(link);
		}

		scene.add(chainGroup);
		elements.push(chainGroup);
		chains.push(chainGroup);
		return chainGroup;
	}

	function createParachuteBale(x, y, z) {
		var geometry = new THREE.CylinderGeometry(2, 2, 3, 8);
		var material = new THREE.MeshStandardMaterial({
			color: 0xdc143c,
			metalness: 0.2,
			roughness: 0.8
		});
		var bale = new THREE.Mesh(geometry, material);
		bale.position.set(x, y, z);
		bale.castShadow = true;
		bale.receiveShadow = true;
		scene.add(bale);
		elements.push(bale);
		return bale;
	}

	function createDeckLight(x, y, z) {
		var geometry = new THREE.SphereGeometry(0.8, 8, 8);
		var material = new THREE.MeshStandardMaterial({
			color: 0xffff00,
			emissive: 0xffff00,
			emissiveIntensity: 0.8,
			metalness: 0.5,
			roughness: 0.5
		});
		var light = new THREE.Mesh(geometry, material);
		light.position.set(x, y, z);
		light.castShadow = true;
		light.receiveShadow = true;
		scene.add(light);
		elements.push(light);
		deckLights.push({ mesh: light, baseIntensity: 0.8, flicker: Math.random() });
		return light;
	}

	function createBrokenDeckSection(x, z) {
		var geometry = new THREE.BoxGeometry(12, 0.5, 8);
		var material = new THREE.MeshStandardMaterial({
			color: 0x6a5acd,
			metalness: 0.4,
			roughness: 0.6
		});
		var section = new THREE.Mesh(geometry, material);
		section.position.set(x, -0.5, z);
		section.castShadow = true;
		section.receiveShadow = true;
		scene.add(section);
		elements.push(section);
		return section;
	}

	function createEdgeRailing(startX, startZ, endX, endZ) {
		var railGeometry = new THREE.BoxGeometry(0.5, 2, 40);
		var railMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.6,
			roughness: 0.5
		});
		var rail = new THREE.Mesh(railGeometry, railMaterial);
		rail.position.set(startX, 1.5, 0);
		rail.castShadow = true;
		rail.receiveShadow = true;
		scene.add(rail);
		elements.push(rail);
		return rail;
	}

	function createAntiGravityEmitter(x, y, z) {
		var geometry = new THREE.ConeGeometry(1.5, 2, 8);
		var material = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ffff,
			emissiveIntensity: 0.5,
			metalness: 0.7,
			roughness: 0.3
		});
		var emitter = new THREE.Mesh(geometry, material);
		emitter.position.set(x, y, z);
		emitter.rotation.z = Math.PI / 2;
		emitter.castShadow = true;
		emitter.receiveShadow = true;
		scene.add(emitter);
		elements.push(emitter);
		return emitter;
	}

	function createAmmoStorageCrate(x, y, z) {
		var geometry = new THREE.BoxGeometry(4, 4, 4);
		var material = new THREE.MeshStandardMaterial({
			color: 0x8b4513,
			metalness: 0.3,
			roughness: 0.8
		});
		var crate = new THREE.Mesh(geometry, material);
		crate.position.set(x, y, z);
		crate.castShadow = true;
		crate.receiveShadow = true;
		scene.add(crate);
		elements.push(crate);
		return crate;
	}

	function createFuelTank(x, y, z) {
		var geometry = new THREE.CylinderGeometry(2, 2, 5, 8);
		var material = new THREE.MeshStandardMaterial({
			color: 0x32cd32,
			metalness: 0.6,
			roughness: 0.4
		});
		var tank = new THREE.Mesh(geometry, material);
		tank.position.set(x, y, z);
		tank.castShadow = true;
		tank.receiveShadow = true;
		scene.add(tank);
		elements.push(tank);
		return tank;
	}

	function createControlConsole(x, y, z) {
		var geometry = new THREE.BoxGeometry(3, 3, 2);
		var material = new THREE.MeshStandardMaterial({
			color: 0x1c1c1c,
			metalness: 0.5,
			roughness: 0.6
		});
		var console = new THREE.Mesh(geometry, material);
		console.position.set(x, y, z);
		console.castShadow = true;
		console.receiveShadow = true;
		scene.add(console);
		elements.push(console);
		return console;
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		elements = [];
		enginePods = [];
		deckLights = [];
		chains = [];
		time = 0;

		createCargoDeck();

		createEnginePod(-35, 8, -15);
		createEnginePort(35, 8, -15);
		createEnginePort(-35, 8, 15);
		createEnginePort(35, 8, 15);

		createFlightCabin();

		createCargoCrane();

		createDefensiveTurret(-25, 3, -18);
		createDefensiveTurret(25, 3, -18);
		createDefensiveTurret(-30, 3, 18);

		createMooringChain(-38, -18);
		createMooringChain(38, -18);
		createMooringChain(-28, 18);
		createMooringChain(28, 18);

		createShippingContainer(-20, 3, 5, 10, 6, 8, 0xff4444);
		createShippingContainer(10, 3, -8, 10, 6, 8, 0xff4444);
		createShippingContainer(-15, 3, -18, 10, 6, 8, 0x4444ff);
		createShippingContainer(20, 3, 12, 10, 6, 8, 0x4444ff);

		createParachuteBale(-28, 3, 8);
		createParachuteBale(28, 3, -5);
		createParachuteBale(0, 3, 18);

		createDeckLight(-15, 1.5, -10);
		createDeckLight(15, 1.5, 10);
		createDeckLight(0, 1.5, 0);
		createDeckLight(-25, 1.5, 15);
		createDeckLight(25, 1.5, -15);

		createBrokenDeckSection(-10, -25);
		createBrokenDeckSection(15, 25);

		createEdgeRailing(-39, -19, -39, 19);
		createEdgeRailing(39, -19, 39, 19);

		createAntiGravityEmitter(-10, 15, 12);
		createAntiGravityEmitter(10, 15, -12);

		createAmmoStorageCrate(-8, 3, -5);
		createAmmoStorageCrate(12, 3, 8);

		createFuelTank(0, 3, 25);
		createFuelTank(-25, 3, -15);

		createControlConsole(-30, 6, 14);

		scene.background = new THREE.Color(0x1a1a2e);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(40, 50, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);

		var fogLight = new THREE.PointLight(0x00ff88, 0.5, 80);
		fogLight.position.set(-35, 8, -15);
		scene.add(fogLight);

		var fogLight2 = new THREE.PointLight(0x00ff88, 0.5, 80);
		fogLight2.position.set(35, 8, 15);
		scene.add(fogLight2);
	}

	function createEnginePort(x, y, z) {
		createEnginePort(x, y, z);
	}

	function update(delta) {
		time += delta;

		var i = 0;
		for (i = 0; i < enginePods.length; i++) {
			var pod = enginePods[i];
			pod.pulse += delta * 2;
			var pulseAmount = Math.sin(pod.pulse) * 0.8;
			pod.mesh.position.y = pod.baseY + pulseAmount;
			pod.mesh.scale.set(1 + pulseAmount * 0.05, 1 + pulseAmount * 0.05, 1 + pulseAmount * 0.05);
		}

		if (craneArm) {
			craneArm.rotation.y = Math.sin(time * 0.5) * 0.3;
		}

		for (i = 0; i < deckLights.length; i++) {
			var light = deckLights[i];
			light.flicker += delta * 5;
			var flicker = light.baseIntensity + Math.sin(light.flicker * 3.5) * 0.2;
			light.mesh.material.emissiveIntensity = Math.max(0.3, flicker);
		}

		for (i = 0; i < chains.length; i++) {
			var chain = chains[i];
			chain.position.y = Math.sin(time * 0.8 + i) * 0.5;
		}
	}

	function reset() {
		time = 0;

		var i = 0;
		for (i = 0; i < elements.length; i++) {
			scene.remove(elements[i]);
		}

		elements = [];
		enginePods = [];
		deckLights = [];
		chains = [];
		craneArm = null;

		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
