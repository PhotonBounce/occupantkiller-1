window.WarTrain = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var trainGroup = null;
	var stationGroup = null;
	var tracksGroup = null;
	var debrisGroup = null;
	var whistleTimer = 0;
	var steamBursts = [];
	var signalLights = [];
	var aaGuns = [];
	var flakParticles = [];

	var materials = {
		steel: new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.8, roughness: 0.2 }),
		rust: new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.4, roughness: 0.7 }),
		brass: new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.9, roughness: 0.1 }),
		red: new THREE.MeshStandardMaterial({ color: 0xdc143c, metalness: 0.3, roughness: 0.6 }),
		green: new THREE.MeshStandardMaterial({ color: 0x2d5016, metalness: 0.4, roughness: 0.5 }),
		concrete: new THREE.MeshStandardMaterial({ color: 0x8b8680, metalness: 0.0, roughness: 0.8 }),
		wood: new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.0, roughness: 0.9 }),
		black: new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.6, roughness: 0.4 })
	};

	function createLocomotive() {
		var group = new THREE.Group();
		group.position.set(-20, 0, 0);

		var boiler = new THREE.Mesh(
			new THREE.CylinderGeometry(2.5, 2.5, 8, 16),
			materials.black
		);
		boiler.position.set(0, 2.5, 0);
		boiler.rotation.z = Math.PI / 2;
		group.add(boiler);

		var cabin = new THREE.Mesh(
			new THREE.BoxGeometry(3, 3, 4),
			materials.steel
		);
		cabin.position.set(2, 3, 0);
		group.add(cabin);

		var smokestack = new THREE.Mesh(
			new THREE.CylinderGeometry(0.6, 0.7, 3, 8),
			materials.brass
		);
		smokestack.position.set(-1, 5.5, 0);
		group.add(smokestack);

		var wheel1 = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16),
			materials.rust
		);
		wheel1.position.set(-2, 1.2, 2.2);
		wheel1.rotation.z = Math.PI / 2;
		group.add(wheel1);

		var wheel2 = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16),
			materials.rust
		);
		wheel2.position.set(-2, 1.2, -2.2);
		wheel2.rotation.z = Math.PI / 2;
		group.add(wheel2);

		var wheel3 = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16),
			materials.rust
		);
		wheel3.position.set(1, 1.2, 2.2);
		wheel3.rotation.z = Math.PI / 2;
		group.add(wheel3);

		var wheel4 = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16),
			materials.rust
		);
		wheel4.position.set(1, 1.2, -2.2);
		wheel4.rotation.z = Math.PI / 2;
		group.add(wheel4);

		var couplerBar = new THREE.Mesh(
			new THREE.BoxGeometry(0.4, 0.3, 0.3),
			materials.brass
		);
		couplerBar.position.set(5, 2, 0);
		group.add(couplerBar);

		return group;
	}

	function createFlatcar() {
		var group = new THREE.Group();
		group.position.set(-8, 0, 0);

		var deck = new THREE.Mesh(
			new THREE.BoxGeometry(6, 0.8, 4),
			materials.rust
		);
		deck.position.set(0, 1.5, 0);
		group.add(deck);

		var sideRail1 = new THREE.Mesh(
			new THREE.BoxGeometry(6, 0.4, 0.3),
			materials.steel
		);
		sideRail1.position.set(0, 2.3, 1.8);
		group.add(sideRail1);

		var sideRail2 = new THREE.Mesh(
			new THREE.BoxGeometry(6, 0.4, 0.3),
			materials.steel
		);
		sideRail2.position.set(0, 2.3, -1.8);
		group.add(sideRail2);

		var tank = new THREE.Mesh(
			new THREE.BoxGeometry(3.5, 2.2, 2.5),
			materials.green
		);
		tank.position.set(-0.5, 3, 0);
		group.add(tank);

		var turret = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1, 0.6, 16),
			materials.green
		);
		turret.position.set(-0.5, 4.8, 0);
		group.add(turret);

		var gun = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8),
			materials.steel
		);
		gun.position.set(-0.5, 5.2, 0);
		gun.rotation.z = Math.PI / 6;
		group.add(gun);

		var wheel1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel1.position.set(-2, 0.9, 1.8);
		wheel1.rotation.z = Math.PI / 2;
		group.add(wheel1);

		var wheel2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel2.position.set(-2, 0.9, -1.8);
		wheel2.rotation.z = Math.PI / 2;
		group.add(wheel2);

		var wheel3 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel3.position.set(2, 0.9, 1.8);
		wheel3.rotation.z = Math.PI / 2;
		group.add(wheel3);

		var wheel4 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel4.position.set(2, 0.9, -1.8);
		wheel4.rotation.z = Math.PI / 2;
		group.add(wheel4);

		return group;
	}

	function createBoxcar() {
		var group = new THREE.Group();
		group.position.set(2, 0, 0);

		var body = new THREE.Mesh(
			new THREE.BoxGeometry(5, 4, 3.5),
			materials.rust
		);
		body.position.set(0, 2.5, 0);
		group.add(body);

		var door = new THREE.Mesh(
			new THREE.BoxGeometry(2.2, 3, 0.3),
			materials.steel
		);
		door.position.set(0.5, 2.5, 1.8);
		group.add(door);

		var handle = new THREE.Mesh(
			new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6),
			materials.brass
		);
		handle.position.set(1.8, 2.5, 1.95);
		handle.rotation.z = Math.PI / 2;
		group.add(handle);

		var roof = new THREE.Mesh(
			new THREE.BoxGeometry(5, 0.5, 3.5),
			materials.rust
		);
		roof.position.set(0, 5.2, 0);
		group.add(roof);

		var vent = new THREE.Mesh(
			new THREE.BoxGeometry(1.5, 1, 0.5),
			materials.steel
		);
		vent.position.set(-1, 5.6, 0);
		group.add(vent);

		var wheel1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel1.position.set(-2, 0.9, 1.6);
		wheel1.rotation.z = Math.PI / 2;
		group.add(wheel1);

		var wheel2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel2.position.set(-2, 0.9, -1.6);
		wheel2.rotation.z = Math.PI / 2;
		group.add(wheel2);

		var wheel3 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel3.position.set(2, 0.9, 1.6);
		wheel3.rotation.z = Math.PI / 2;
		group.add(wheel3);

		var wheel4 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel4.position.set(2, 0.9, -1.6);
		wheel4.rotation.z = Math.PI / 2;
		group.add(wheel4);

		return group;
	}

	function createArmoredcar() {
		var group = new THREE.Group();
		group.position.set(10, 0, 0);

		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(5, 3.5, 3),
			materials.steel
		);
		hull.position.set(0, 2.2, 0);
		group.add(hull);

		var armor1 = new THREE.Mesh(
			new THREE.BoxGeometry(0.4, 3.5, 3),
			materials.brass
		);
		armor1.position.set(2.7, 2.2, 0);
		group.add(armor1);

		var armor2 = new THREE.Mesh(
			new THREE.BoxGeometry(0.4, 3.5, 3),
			materials.brass
		);
		armor2.position.set(-2.7, 2.2, 0);
		group.add(armor2);

		var window1 = new THREE.Mesh(
			new THREE.BoxGeometry(0.8, 0.8, 0.2),
			materials.brass
		);
		window1.position.set(-1.5, 3.2, 1.5);
		group.add(window1);

		var window2 = new THREE.Mesh(
			new THREE.BoxGeometry(0.8, 0.8, 0.2),
			materials.brass
		);
		window2.position.set(1.5, 3.2, 1.5);
		group.add(window2);

		var antenna = new THREE.Mesh(
			new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6),
			materials.brass
		);
		antenna.position.set(-1.5, 5.5, -1.2);
		group.add(antenna);

		var wheel1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel1.position.set(-2, 0.9, 1.5);
		wheel1.rotation.z = Math.PI / 2;
		group.add(wheel1);

		var wheel2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel2.position.set(-2, 0.9, -1.5);
		wheel2.rotation.z = Math.PI / 2;
		group.add(wheel2);

		var wheel3 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel3.position.set(2, 0.9, 1.5);
		wheel3.rotation.z = Math.PI / 2;
		group.add(wheel3);

		var wheel4 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel4.position.set(2, 0.9, -1.5);
		wheel4.rotation.z = Math.PI / 2;
		group.add(wheel4);

		return group;
	}

	function createFlakcar() {
		var group = new THREE.Group();
		group.position.set(18, 0, 0);

		var deck = new THREE.Mesh(
			new THREE.BoxGeometry(5, 0.8, 3),
			materials.red
		);
		deck.position.set(0, 1.5, 0);
		group.add(deck);

		var platform = new THREE.Mesh(
			new THREE.BoxGeometry(3, 0.6, 3),
			materials.steel
		);
		platform.position.set(0, 2.3, 0);
		group.add(platform);

		var aaGun1 = createAAgun();
		aaGun1.position.set(-1.2, 3.2, -0.8);
		aaGun1.userData.gunIndex = 0;
		group.add(aaGun1);
		aaGuns.push(aaGun1);

		var aaGun2 = createAAgun();
		aaGun2.position.set(1.2, 3.2, -0.8);
		aaGun2.userData.gunIndex = 1;
		group.add(aaGun2);
		aaGuns.push(aaGun2);

		var aaGun3 = createAAgun();
		aaGun3.position.set(-1.2, 3.2, 0.8);
		aaGun3.userData.gunIndex = 2;
		group.add(aaGun3);
		aaGuns.push(aaGun3);

		var aaGun4 = createAAgun();
		aaGun4.position.set(1.2, 3.2, 0.8);
		aaGun4.userData.gunIndex = 3;
		group.add(aaGun4);
		aaGuns.push(aaGun4);

		var wheel1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel1.position.set(-2, 0.9, 1.4);
		wheel1.rotation.z = Math.PI / 2;
		group.add(wheel1);

		var wheel2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel2.position.set(-2, 0.9, -1.4);
		wheel2.rotation.z = Math.PI / 2;
		group.add(wheel2);

		var wheel3 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel3.position.set(2, 0.9, 1.4);
		wheel3.rotation.z = Math.PI / 2;
		group.add(wheel3);

		var wheel4 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel4.position.set(2, 0.9, -1.4);
		wheel4.rotation.z = Math.PI / 2;
		group.add(wheel4);

		return group;
	}

	function createAAgun() {
		var group = new THREE.Group();

		var base = new THREE.Mesh(
			new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12),
			materials.brass
		);
		base.position.set(0, 0, 0);
		group.add(base);

		var barrel1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.2, 0.2, 2.2, 8),
			materials.steel
		);
		barrel1.position.set(-0.4, 0.5, 0);
		barrel1.rotation.z = Math.PI / 8;
		group.add(barrel1);

		var barrel2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.2, 0.2, 2.2, 8),
			materials.steel
		);
		barrel2.position.set(0.4, 0.5, 0);
		barrel2.rotation.z = Math.PI / 8;
		group.add(barrel2);

		return group;
	}

	function createCaboose() {
		var group = new THREE.Group();
		group.position.set(26, 0, 0);

		var body = new THREE.Mesh(
			new THREE.BoxGeometry(4, 3.5, 3),
			materials.red
		);
		body.position.set(0, 2.2, 0);
		group.add(body);

		var observation = new THREE.Mesh(
			new THREE.BoxGeometry(2, 2, 2),
			materials.steel
		);
		observation.position.set(0, 4.2, 0);
		group.add(observation);

		var window1 = new THREE.Mesh(
			new THREE.BoxGeometry(0.6, 0.6, 0.1),
			materials.brass
		);
		window1.position.set(-0.5, 4.4, 1.0);
		group.add(window1);

		var window2 = new THREE.Mesh(
			new THREE.BoxGeometry(0.6, 0.6, 0.1),
			materials.brass
		);
		window2.position.set(0.5, 4.4, 1.0);
		group.add(window2);

		var light = new THREE.Mesh(
			new THREE.SphereGeometry(0.4, 8, 8),
			materials.red
		);
		light.position.set(0, 4.8, -1.2);
		light.userData.isSignal = true;
		group.add(light);
		signalLights.push(light);

		var wheel1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel1.position.set(-1.5, 0.9, 1.5);
		wheel1.rotation.z = Math.PI / 2;
		group.add(wheel1);

		var wheel2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel2.position.set(-1.5, 0.9, -1.5);
		wheel2.rotation.z = Math.PI / 2;
		group.add(wheel2);

		var wheel3 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel3.position.set(1.5, 0.9, 1.5);
		wheel3.rotation.z = Math.PI / 2;
		group.add(wheel3);

		var wheel4 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12),
			materials.black
		);
		wheel4.position.set(1.5, 0.9, -1.5);
		wheel4.rotation.z = Math.PI / 2;
		group.add(wheel4);

		return group;
	}

	function createTracks() {
		var group = new THREE.Group();

		var leftRail = new THREE.Mesh(
			new THREE.BoxGeometry(80, 0.3, 0.6),
			materials.steel
		);
		leftRail.position.set(0, 0.1, -1.5);
		group.add(leftRail);

		var rightRail = new THREE.Mesh(
			new THREE.BoxGeometry(80, 0.3, 0.6),
			materials.steel
		);
		rightRail.position.set(0, 0.1, 1.5);
		group.add(rightRail);

		for (var i = -40; i < 40; i += 2) {
			var tie = new THREE.Mesh(
				new THREE.BoxGeometry(2.5, 0.25, 3.5),
				materials.wood
			);
			tie.position.set(i, 0.2, 0);
			group.add(tie);
		}

		var bedplate = new THREE.Mesh(
			new THREE.BoxGeometry(80, 0.5, 4),
			materials.concrete
		);
		bedplate.position.set(0, -0.25, 0);
		group.add(bedplate);

		return group;
	}

	function createStation() {
		var group = new THREE.Group();

		var building = new THREE.Mesh(
			new THREE.BoxGeometry(10, 6, 8),
			materials.concrete
		);
		building.position.set(-25, 3, 15);
		group.add(building);

		var roof = new THREE.Mesh(
			new THREE.BoxGeometry(10.5, 1.5, 8.5),
			materials.rust
		);
		roof.position.set(-25, 7.5, 15);
		group.add(roof);

		var window1 = new THREE.Mesh(
			new THREE.BoxGeometry(1.5, 1.5, 0.2),
			materials.brass
		);
		window1.position.set(-29, 4, 19);
		group.add(window1);

		var window2 = new THREE.Mesh(
			new THREE.BoxGeometry(1.5, 1.5, 0.2),
			materials.brass
		);
		window2.position.set(-21, 4, 19);
		group.add(window2);

		var door = new THREE.Mesh(
			new THREE.BoxGeometry(2, 3, 0.3),
			materials.black
		);
		door.position.set(-25, 1.5, 19);
		group.add(door);

		var platform = new THREE.Mesh(
			new THREE.BoxGeometry(12, 1, 10),
			materials.concrete
		);
		platform.position.set(-25, 0.5, 8);
		group.add(platform);

		var signalTower = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 8, 8),
			materials.steel
		);
		signalTower.position.set(-18, 4, 22);
		group.add(signalTower);

		var signalHead = new THREE.Mesh(
			new THREE.BoxGeometry(2, 2, 2),
			materials.brass
		);
		signalHead.position.set(-18, 8.5, 22);
		group.add(signalHead);

		var signalLight = new THREE.Mesh(
			new THREE.SphereGeometry(0.5, 8, 8),
			materials.green
		);
		signalLight.position.set(-17.5, 8.2, 22);
		signalLight.userData.isSignal = true;
		group.add(signalLight);
		signalLights.push(signalLight);

		var waterTank = new THREE.Mesh(
			new THREE.CylinderGeometry(1.8, 1.8, 2, 12),
			materials.rust
		);
		waterTank.position.set(-35, 4, 10);
		group.add(waterTank);

		var tankSupport1 = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 4, 0.3),
			materials.steel
		);
		tankSupport1.position.set(-34, 2, 9);
		group.add(tankSupport1);

		var tankSupport2 = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 4, 0.3),
			materials.steel
		);
		tankSupport2.position.set(-36, 2, 11);
		group.add(tankSupport2);

		return group;
	}

	function createDebris() {
		var group = new THREE.Group();

		var rubble1 = new THREE.Mesh(
			new THREE.BoxGeometry(2.5, 1.5, 2),
			materials.concrete
		);
		rubble1.position.set(15, 0.7, -20);
		rubble1.rotation.z = Math.PI / 12;
		group.add(rubble1);

		var rubble2 = new THREE.Mesh(
			new THREE.BoxGeometry(2, 1.2, 2.5),
			materials.concrete
		);
		rubble2.position.set(20, 0.6, -25);
		rubble2.rotation.x = Math.PI / 10;
		group.add(rubble2);

		var crater = new THREE.Mesh(
			new THREE.CylinderGeometry(3, 3.5, 1.5, 16),
			materials.concrete
		);
		crater.position.set(35, -0.5, -15);
		group.add(crater);

		var metalScrap = new THREE.Mesh(
			new THREE.BoxGeometry(1.5, 0.5, 1),
			materials.steel
		);
		metalScrap.position.set(-30, 0.3, -22);
		metalScrap.rotation.z = Math.PI / 4;
		group.add(metalScrap);

		var metalScrap2 = new THREE.Mesh(
			new THREE.BoxGeometry(1.2, 0.6, 0.8),
			materials.brass
		);
		metalScrap2.position.set(-35, 0.4, -20);
		metalScrap2.rotation.z = -Math.PI / 5;
		group.add(metalScrap2);

		var ammunition = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.3, 1.2, 6),
			materials.brass
		);
		ammunition.position.set(25, 0.6, -30);
		ammunition.rotation.z = Math.PI / 3;
		group.add(ammunition);

		return group;
	}

	function updateWhistle(delta) {
		whistleTimer += delta;

		if (whistleTimer > 3.0) {
			whistleTimer = 0;
			createSteamBurst();
		}
	}

	function createSteamBurst() {
		var burst = {
			x: -20,
			y: 6,
			z: 0,
			time: 0,
			maxTime: 1.5,
			mesh: null
		};

		var geometry = new THREE.SphereGeometry(0.4, 4, 4);
		var material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			emissive: 0xcccccc,
			emissiveIntensity: 0.5,
			transparent: true,
			opacity: 0.6
		});
		burst.mesh = new THREE.Mesh(geometry, material);
		burst.mesh.position.set(burst.x, burst.y, burst.z);

		scene.add(burst.mesh);
		steamBursts.push(burst);
	}

	function updateSteamBursts(delta) {
		var i = steamBursts.length - 1;
		while (i >= 0) {
			var burst = steamBursts[i];
			burst.time += delta;

			burst.mesh.position.y += delta * 3;
			burst.mesh.scale.x += delta * 0.8;
			burst.mesh.scale.y += delta * 0.8;
			burst.mesh.scale.z += delta * 0.8;

			var progress = burst.time / burst.maxTime;
			burst.mesh.material.opacity = 0.6 * (1 - progress);

			if (burst.time > burst.maxTime) {
				scene.remove(burst.mesh);
				burst.mesh.geometry.dispose();
				burst.mesh.material.dispose();
				steamBursts.splice(i, 1);
			}

			i--;
		}
	}

	function updateAAGuns(delta) {
		var i = 0;
		while (i < aaGuns.length) {
			var gun = aaGuns[i];
			var children = gun.children;

			for (var j = 1; j < children.length; j++) {
				var barrel = children[j];
				barrel.rotation.z += delta * 2;
			}

			i++;
		}
	}

	function updateSignalLights(delta) {
		var i = 0;
		while (i < signalLights.length) {
			var light = signalLights[i];

			var phase = (Date.now() / 500) % 2;
			if (phase < 1) {
				light.material.emissiveIntensity = 1;
			} else {
				light.material.emissiveIntensity = 0.2;
			}

			i++;
		}
	}

	function init(sceneparam, cameraparam) {
		scene = sceneparam;
		camera = cameraparam;

		trainGroup = new THREE.Group();
		trainGroup.position.set(0, 0, 0);
		scene.add(trainGroup);

		var loco = createLocomotive();
		trainGroup.add(loco);

		var flatcar = createFlatcar();
		trainGroup.add(flatcar);

		var boxcar = createBoxcar();
		trainGroup.add(boxcar);

		var armoredcar = createArmoredcar();
		trainGroup.add(armoredcar);

		var flakcar = createFlakcar();
		trainGroup.add(flakcar);

		var caboose = createCaboose();
		trainGroup.add(caboose);

		tracksGroup = createTracks();
		scene.add(tracksGroup);

		stationGroup = createStation();
		scene.add(stationGroup);

		debrisGroup = createDebris();
		scene.add(debrisGroup);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(30, 20, 30);
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
	}

	function update(delta) {
		if (trainGroup !== null) {
			trainGroup.rotation.y += delta * 0.05;
		}

		updateWhistle(delta);
		updateSteamBursts(delta);
		updateAAGuns(delta);
		updateSignalLights(delta);
	}

	function reset() {
		if (scene !== null && trainGroup !== null) {
			scene.remove(trainGroup);
		}

		trainGroup = null;
		stationGroup = null;
		tracksGroup = null;
		debrisGroup = null;

		var i = steamBursts.length - 1;
		while (i >= 0) {
			var burst = steamBursts[i];
			scene.remove(burst.mesh);
			burst.mesh.geometry.dispose();
			burst.mesh.material.dispose();
			i--;
		}
		steamBursts = [];

		signalLights = [];
		aaGuns = [];

		whistleTimer = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
