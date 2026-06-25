window.FrozenPalace = (function() {
	'use strict';

	var scene;
	var camera;
	var structures;
	var particles;
	var materials;
	var auroraLightLeft;
	var auroraLightRight;
	var ambientLight;
	var time;
	var icicleDripParticles;

	function initMaterials() {
		materials = {};
		materials.iceBlue = new THREE.MeshStandardMaterial({
			color: 0x4A90E2,
			metalness: 0.6,
			roughness: 0.2,
			emissive: 0x1A4D8C
		});
		materials.marbleWhite = new THREE.MeshStandardMaterial({
			color: 0xF0F0F0,
			metalness: 0.3,
			roughness: 0.4,
			emissive: 0x808080
		});
		materials.militaryDark = new THREE.MeshStandardMaterial({
			color: 0x2C2C2C,
			metalness: 0.4,
			roughness: 0.6,
			emissive: 0x0A0A0A
		});
		materials.frozenClear = new THREE.MeshStandardMaterial({
			color: 0xB0E0E6,
			metalness: 0.8,
			roughness: 0.1,
			emissive: 0x4A7C8C,
			transparent: true,
			opacity: 0.85
		});
		materials.gold = new THREE.MeshStandardMaterial({
			color: 0xD4AF37,
			metalness: 0.9,
			roughness: 0.1,
			emissive: 0x6B5C1F
		});
	}

	function createGrandEntrance() {
		var group = new THREE.Group();
		var archWidth = 16;
		var archHeight = 20;

		var leftColumn = new THREE.Mesh(
			new THREE.CylinderGeometry(2, 2, archHeight, 16),
			materials.marbleWhite
		);
		leftColumn.position.set(-archWidth / 2 - 2, archHeight / 2, 0);
		group.add(leftColumn);

		var rightColumn = new THREE.Mesh(
			new THREE.CylinderGeometry(2, 2, archHeight, 16),
			materials.marbleWhite
		);
		rightColumn.position.set(archWidth / 2 + 2, archHeight / 2, 0);
		group.add(rightColumn);

		var archTop = new THREE.Mesh(
			new THREE.ConeGeometry(12, 4, 32),
			materials.iceBlue
		);
		archTop.position.set(0, archHeight, 0);
		group.add(archTop);

		var doorFrame = new THREE.Mesh(
			new THREE.BoxGeometry(archWidth, archHeight - 2, 0.5),
			materials.frozenClear
		);
		doorFrame.position.set(0, (archHeight - 2) / 2, 2);
		group.add(doorFrame);

		group.position.set(0, 0, -35);
		return group;
	}

	function createFrozenChandeliers() {
		var group = new THREE.Group();

		var chandelier1 = createChandelierUnit();
		chandelier1.position.set(-15, 18, -10);
		group.add(chandelier1);

		var chandelier2 = createChandelierUnit();
		chandelier2.position.set(15, 18, -10);
		group.add(chandelier2);

		var chandelier3 = createChandelierUnit();
		chandelier3.position.set(-15, 18, 10);
		group.add(chandelier3);

		var chandelier4 = createChandelierUnit();
		chandelier4.position.set(15, 18, 10);
		group.add(chandelier4);

		return group;
	}

	function createChandelierUnit() {
		var group = new THREE.Group();

		var chain = new THREE.Mesh(
			new THREE.CylinderGeometry(0.2, 0.2, 3, 8),
			materials.gold
		);
		chain.position.y = 0;
		group.add(chain);

		var bulb = new THREE.Mesh(
			new THREE.SphereGeometry(1, 12, 12),
			materials.frozenClear
		);
		bulb.position.y = -2.5;
		group.add(bulb);

		var candle1 = new THREE.Mesh(
			new THREE.ConeGeometry(0.3, 1.5, 8),
			materials.gold
		);
		candle1.position.set(-1, -2, 0);
		group.add(candle1);

		var candle2 = new THREE.Mesh(
			new THREE.ConeGeometry(0.3, 1.5, 8),
			materials.gold
		);
		candle2.position.set(1, -2, 0);
		group.add(candle2);

		var candle3 = new THREE.Mesh(
			new THREE.ConeGeometry(0.3, 1.5, 8),
			materials.gold
		);
		candle3.position.set(0, -2, -1);
		group.add(candle3);

		return group;
	}

	function createThroneRoom() {
		var group = new THREE.Group();

		var throneBase = new THREE.Mesh(
			new THREE.BoxGeometry(8, 1, 8),
			materials.marbleWhite
		);
		throneBase.position.set(0, 1, 30);
		group.add(throneBase);

		var throneBack = new THREE.Mesh(
			new THREE.BoxGeometry(6, 10, 1),
			materials.iceBlue
		);
		throneBack.position.set(0, 7, 27);
		group.add(throneBack);

		var armrest1 = new THREE.Mesh(
			new THREE.BoxGeometry(1, 4, 3),
			materials.gold
		);
		armrest1.position.set(-4, 3, 30);
		group.add(armrest1);

		var armrest2 = new THREE.Mesh(
			new THREE.BoxGeometry(1, 4, 3),
			materials.gold
		);
		armrest2.position.set(4, 3, 30);
		group.add(armrest2);

		return group;
	}

	function createIceBallroom() {
		var group = new THREE.Group();

		var floor = new THREE.Mesh(
			new THREE.BoxGeometry(25, 0.5, 25),
			materials.frozenClear
		);
		floor.position.set(0, 0.25, -30);
		group.add(floor);

		var wall1 = new THREE.Mesh(
			new THREE.BoxGeometry(25, 12, 0.5),
			materials.iceBlue
		);
		wall1.position.set(0, 6, -42.5);
		group.add(wall1);

		var wall2 = new THREE.Mesh(
			new THREE.BoxGeometry(25, 12, 0.5),
			materials.iceBlue
		);
		wall2.position.set(0, 6, -17.5);
		group.add(wall2);

		var wall3 = new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 12, 25),
			materials.iceBlue
		);
		wall3.position.set(-12.5, 6, -30);
		group.add(wall3);

		var wall4 = new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 12, 25),
			materials.iceBlue
		);
		wall4.position.set(12.5, 6, -30);
		group.add(wall4);

		return group;
	}

	function createFrozenFountain() {
		var group = new THREE.Group();

		var base = new THREE.Mesh(
			new THREE.CylinderGeometry(5, 6, 1, 24),
			materials.marbleWhite
		);
		base.position.set(-30, 0.5, 15);
		group.add(base);

		var basin = new THREE.Mesh(
			new THREE.CylinderGeometry(4, 4, 2, 24),
			materials.iceBlue
		);
		basin.position.set(-30, 3, 15);
		group.add(basin);

		var central = new THREE.Mesh(
			new THREE.ConeGeometry(2, 6, 16),
			materials.frozenClear
		);
		central.position.set(-30, 5.5, 15);
		group.add(central);

		var stream1 = new THREE.Mesh(
			new THREE.ConeGeometry(1.5, 4, 12),
			materials.iceBlue
		);
		stream1.position.set(-32, 3, 15);
		group.add(stream1);

		return group;
	}

	function createSnowDrifts() {
		var group = new THREE.Group();

		var drift1 = new THREE.Mesh(
			new THREE.BoxGeometry(8, 6, 4),
			materials.marbleWhite
		);
		drift1.position.set(-20, 3, -50);
		drift1.rotation.z = 0.3;
		group.add(drift1);

		var drift2 = new THREE.Mesh(
			new THREE.BoxGeometry(6, 5, 5),
			materials.marbleWhite
		);
		drift2.position.set(25, 2.5, -45);
		drift2.rotation.z = -0.2;
		group.add(drift2);

		var drift3 = new THREE.Mesh(
			new THREE.BoxGeometry(7, 4, 6),
			materials.marbleWhite
		);
		drift3.position.set(30, 2, 20);
		drift3.rotation.z = 0.4;
		group.add(drift3);

		return group;
	}

	function createMarbleColumns() {
		var group = new THREE.Group();

		var positions = [
			[-20, 0, -15],
			[-10, 0, -15],
			[10, 0, -15],
			[20, 0, -15],
			[-20, 0, 15],
			[-10, 0, 15],
			[10, 0, 15],
			[20, 0, 15]
		];

		for (var i = 0; i < positions.length; i++) {
			var column = new THREE.Mesh(
				new THREE.CylinderGeometry(1.5, 1.5, 16, 16),
				materials.marbleWhite
			);
			column.position.set(positions[i][0], 8, positions[i][2]);
			group.add(column);

			var capital = new THREE.Mesh(
				new THREE.BoxGeometry(2.5, 0.8, 2.5),
				materials.gold
			);
			capital.position.set(positions[i][0], 16, positions[i][2]);
			group.add(capital);
		}

		return group;
	}

	function createTreasuryVault() {
		var group = new THREE.Group();

		var vaultDoor = new THREE.Mesh(
			new THREE.BoxGeometry(6, 8, 1),
			materials.militaryDark
		);
		vaultDoor.position.set(30, 4, -5);
		group.add(vaultDoor);

		var wheelLock = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12),
			materials.gold
		);
		wheelLock.position.set(30, 4, -5.5);
		group.add(wheelLock);

		var vault = new THREE.Mesh(
			new THREE.BoxGeometry(8, 10, 8),
			materials.iceBlue
		);
		vault.position.set(30, 5, 2);
		group.add(vault);

		return group;
	}

	function createCommandPost() {
		var group = new THREE.Group();

		var base = new THREE.Mesh(
			new THREE.BoxGeometry(12, 0.5, 10),
			materials.militaryDark
		);
		base.position.set(0, 0.25, 0);
		group.add(base);

		var wall1 = new THREE.Mesh(
			new THREE.BoxGeometry(12, 8, 0.5),
			materials.militaryDark
		);
		wall1.position.set(0, 4, -5);
		group.add(wall1);

		var wall2 = new THREE.Mesh(
			new THREE.BoxGeometry(12, 8, 0.5),
			materials.militaryDark
		);
		wall2.position.set(0, 4, 5);
		group.add(wall2);

		var wall3 = new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 8, 10),
			materials.militaryDark
		);
		wall3.position.set(-6, 4, 0);
		group.add(wall3);

		var wall4 = new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 8, 10),
			materials.militaryDark
		);
		wall4.position.set(6, 4, 0);
		group.add(wall4);

		var table = new THREE.Mesh(
			new THREE.BoxGeometry(8, 0.8, 4),
			materials.militaryDark
		);
		table.position.set(0, 1, 0);
		group.add(table);

		return group;
	}

	function createStainedGlassFragments() {
		var group = new THREE.Group();

		var positions = [
			[-25, 10, -48],
			[-15, 12, -48],
			[-5, 11, -48],
			[5, 13, -48],
			[15, 10, -48],
			[25, 12, -48]
		];

		for (var i = 0; i < positions.length; i++) {
			var frag1 = new THREE.Mesh(
				new THREE.BoxGeometry(2, 3, 0.2),
				materials.frozenClear
			);
			frag1.position.set(positions[i][0], positions[i][1], positions[i][2]);
			frag1.rotation.y = Math.random() * 0.3;
			group.add(frag1);

			var frag2 = new THREE.Mesh(
				new THREE.BoxGeometry(1.5, 2, 0.2),
				materials.iceBlue
			);
			frag2.position.set(positions[i][0] + 1, positions[i][1] + 1, positions[i][2]);
			frag2.rotation.y = Math.random() * 0.3;
			group.add(frag2);
		}

		return group;
	}

	function createIcicleClusters() {
		var group = new THREE.Group();

		var positions = [
			[-30, 20, -40],
			[30, 19, -40],
			[-25, 18, 0],
			[25, 20, 0],
			[-30, 19, 35],
			[30, 20, 35]
		];

		for (var i = 0; i < positions.length; i++) {
			for (var j = 0; j < 4; j++) {
				var icicle = new THREE.Mesh(
					new THREE.ConeGeometry(0.3, 3 + Math.random() * 2, 8),
					materials.frozenClear
				);
				icicle.position.set(
					positions[i][0] + (Math.random() - 0.5) * 3,
					positions[i][1] - j * 2.5,
					positions[i][2]
				);
				group.add(icicle);
			}
		}

		return group;
	}

	function createCeilingBeams() {
		var group = new THREE.Group();

		for (var x = -30; x < 40; x += 15) {
			var beam = new THREE.Mesh(
				new THREE.BoxGeometry(2, 0.8, 80),
				materials.marbleWhite
			);
			beam.position.set(x, 20, 0);
			group.add(beam);
		}

		for (var z = -40; z < 50; z += 15) {
			var crossbeam = new THREE.Mesh(
				new THREE.BoxGeometry(80, 0.8, 2),
				materials.marbleWhite
			);
			crossbeam.position.set(0, 20, z);
			group.add(crossbeam);
		}

		return group;
	}

	function createAuroraEffects() {
		auroraLightLeft = new THREE.DirectionalLight(0x00FF88, 0.4);
		auroraLightLeft.position.set(-40, 15, -30);
		scene.add(auroraLightLeft);

		auroraLightRight = new THREE.DirectionalLight(0xFF0088, 0.4);
		auroraLightRight.position.set(40, 15, 30);
		scene.add(auroraLightRight);
	}

	function createLighting() {
		ambientLight = new THREE.AmbientLight(0x8899FF, 0.6);
		scene.add(ambientLight);

		var mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
		mainLight.position.set(20, 25, 20);
		mainLight.castShadow = true;
		scene.add(mainLight);

		var pointLight1 = new THREE.PointLight(0x4A90E2, 0.8, 50);
		pointLight1.position.set(-20, 8, 0);
		scene.add(pointLight1);

		var pointLight2 = new THREE.PointLight(0x4A90E2, 0.8, 50);
		pointLight2.position.set(20, 8, 0);
		scene.add(pointLight2);
	}

	function initParticles() {
		icicleDripParticles = [];
	}

	function updateIcicleDripParticles(delta) {
		var newParticles = [];

		if (Math.random() < 0.3) {
			var sourceX = -40 + Math.random() * 80;
			var sourceZ = -50 + Math.random() * 90;
			var particle = {
				position: new THREE.Vector3(sourceX, 18, sourceZ),
				velocity: new THREE.Vector3(0, -8, 0),
				life: 1.0
			};
			icicleDripParticles.push(particle);
		}

		for (var i = 0; i < icicleDripParticles.length; i++) {
			var p = icicleDripParticles[i];
			p.position.add(p.velocity.clone().multiplyScalar(delta));
			p.life -= delta * 0.5;

			if (p.life > 0) {
				newParticles.push(p);
			}
		}

		icicleDripParticles = newParticles;
	}

	function updateAuroraLighting(delta) {
		time += delta;
		var intensity1 = 0.3 + Math.sin(time * 1.5) * 0.2;
		var intensity2 = 0.3 + Math.cos(time * 1.3) * 0.2;

		auroraLightLeft.intensity = intensity1;
		auroraLightRight.intensity = intensity2;

		var hueShift1 = Math.sin(time * 0.8);
		var hueShift2 = Math.cos(time * 0.7);

		auroraLightLeft.color.setHSL(0.4 + hueShift1 * 0.1, 1, 0.5);
		auroraLightRight.color.setHSL(0.8 + hueShift2 * 0.1, 1, 0.5);
	}

	function createEnvironment() {
		structures = new THREE.Group();

		var entrance = createGrandEntrance();
		structures.add(entrance);

		var chandeliers = createFrozenChandeliers();
		structures.add(chandeliers);

		var throne = createThroneRoom();
		structures.add(throne);

		var ballroom = createIceBallroom();
		structures.add(ballroom);

		var fountain = createFrozenFountain();
		structures.add(fountain);

		var drifts = createSnowDrifts();
		structures.add(drifts);

		var columns = createMarbleColumns();
		structures.add(columns);

		var vault = createTreasuryVault();
		structures.add(vault);

		var command = createCommandPost();
		structures.add(command);

		var glass = createStainedGlassFragments();
		structures.add(glass);

		var icicles = createIcicleClusters();
		structures.add(icicles);

		var beams = createCeilingBeams();
		structures.add(beams);

		scene.add(structures);
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		time = 0;

		initMaterials();
		createLighting();
		createAuroraEffects();
		createEnvironment();
		initParticles();
	}

	function update(delta) {
		updateIcicleDripParticles(delta);
		updateAuroraLighting(delta);

		if (structures) {
			structures.rotation.y += 0.0001;
		}
	}

	function reset() {
		if (scene && structures) {
			scene.remove(structures);
		}
		structures = null;
		icicleDripParticles = [];
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
