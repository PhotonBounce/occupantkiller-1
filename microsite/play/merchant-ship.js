window.MerchantShip = (function() {
	'use strict';

	var scene, camera;
	var gameActive = true;
	var allObjects = [];
	var shipGroup = null;
	var enemies = [];
	var containers = [];
	var lastKeyTime = {};
	var hudVisible = true;
	var gameState = {
		decksCleared: 0,
		piratesNeutralized: 0,
		cargoSecured: false
	};

	var KeySequence = {
		sequence: [],
		timeout: 400,
		timer: null,
		lastTime: 0
	};

	function trackObject(obj) {
		allObjects.push(obj);
		scene.add(obj);
		return obj;
	}

	function createShipHull() {
		var hullGroup = new THREE.Group();

		var belowWaterline = new THREE.Mesh(
			new THREE.BoxGeometry(60, 30, 120),
			new THREE.MeshPhongMaterial({ color: 0x3d0000 })
		);
		belowWaterline.position.y = -15;
		hullGroup.add(belowWaterline);

		var mainDeck = new THREE.Mesh(
			new THREE.BoxGeometry(55, 2, 115),
			new THREE.MeshPhongMaterial({ color: 0x333333 })
		);
		mainDeck.position.y = 16;
		hullGroup.add(mainDeck);

		var forecastle = new THREE.Mesh(
			new THREE.BoxGeometry(50, 8, 25),
			new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
		);
		forecastle.position.set(0, 24, 40);
		hullGroup.add(forecastle);

		var aftcastle = new THREE.Mesh(
			new THREE.BoxGeometry(48, 8, 30),
			new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
		);
		aftcastle.position.set(0, 24, -45);
		hullGroup.add(aftcastle);

		var bridgeTower = new THREE.Mesh(
			new THREE.BoxGeometry(20, 25, 15),
			new THREE.MeshPhongMaterial({ color: 0x222222 })
		);
		bridgeTower.position.set(0, 45, -40);
		hullGroup.add(bridgeTower);

		var bridgeWindows = new THREE.Mesh(
			new THREE.BoxGeometry(18, 8, 13),
			new THREE.MeshPhongMaterial({ color: 0x4488ff, emissive: 0x2244aa })
		);
		bridgeWindows.position.set(0, 48, -38);
		hullGroup.add(bridgeWindows);

		var funnel = new THREE.Mesh(
			new THREE.CylinderGeometry(4, 5, 22, 16),
			new THREE.MeshPhongMaterial({ color: 0x8b4513 })
		);
		funnel.position.set(5, 50, -25);
		hullGroup.add(funnel);

		var mast = new THREE.Mesh(
			new THREE.CylinderGeometry(0.8, 0.8, 40, 8),
			new THREE.MeshPhongMaterial({ color: 0x444444 })
		);
		mast.position.set(-8, 40, -35);
		hullGroup.add(mast);

		var radarDish = new THREE.Mesh(
			new THREE.BoxGeometry(6, 1, 6),
			new THREE.MeshPhongMaterial({ color: 0xffaa00 })
		);
		radarDish.position.set(-8, 65, -35);
		radarDish.userData.isRadar = true;
		hullGroup.add(radarDish);

		createContainerStacks(hullGroup);
		createAnchorChain(hullGroup);
		createShipLadders(hullGroup);
		createLifeboatDavits(hullGroup);
		createEngineHatch(hullGroup);
		createBollards(hullGroup);
		createWaterSpray(hullGroup);
		createSafetyNets(hullGroup);

		shipGroup = hullGroup;
		shipGroup.userData.isShip = true;
		return trackObject(hullGroup);
	}

	function createContainerStacks(parent) {
		var colors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff];
		var positions = [
			[-15, 18, 20], [0, 18, 20], [15, 18, 20],
			[-15, 18, 0], [15, 18, 0],
			[-15, 18, -20], [0, 18, -20], [15, 18, -20]
		];

		var containerIndex = 0;
		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var container = new THREE.Mesh(
				new THREE.BoxGeometry(8, 8, 8),
				new THREE.MeshPhongMaterial({ color: colors[containerIndex % colors.length] })
			);
			container.position.set(pos[0], pos[1], pos[2]);
			container.userData.isContainer = true;
			container.userData.secured = false;
			containers.push(container);
			parent.add(container);
			containerIndex++;

			if (i < 5) {
				var light = new THREE.PointLight(0xff0000, 2, 20);
				light.position.set(pos[0], pos[1] + 5, pos[2]);
				light.userData.isLight = true;
				parent.add(light);
			}
		}
	}

	function createAnchorChain(parent) {
		var geometry = new THREE.BufferGeometry();
		var positions = [];
		var count = 20;
		for (var i = 0; i < count; i++) {
			positions.push(-25, 20 - i * 2, 55);
		}
		geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
		var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
		parent.add(line);
	}

	function createShipLadders(parent) {
		for (var i = 0; i < 3; i++) {
			var x = -20 + i * 20;
			for (var j = 0; j < 4; j++) {
				var step = new THREE.Mesh(
					new THREE.BoxGeometry(3, 1, 3),
					new THREE.MeshPhongMaterial({ color: 0x666666 })
				);
				step.position.set(x, 17 + j * 1.5, 10);
				parent.add(step);
			}
		}
	}

	function createLifeboatDavits(parent) {
		var davitArm = new THREE.Mesh(
			new THREE.CylinderGeometry(0.5, 0.5, 12, 8),
			new THREE.MeshPhongMaterial({ color: 0x555555 })
		);
		davitArm.rotation.z = Math.PI / 6;
		davitArm.position.set(20, 30, -50);
		parent.add(davitArm);

		var boat = new THREE.Mesh(
			new THREE.BoxGeometry(4, 2, 8),
			new THREE.MeshPhongMaterial({ color: 0xff6633 })
		);
		boat.position.set(28, 18, -50);
		parent.add(boat);
	}

	function createEngineHatch(parent) {
		var hatch = new THREE.Mesh(
			new THREE.BoxGeometry(12, 0.5, 12),
			new THREE.MeshPhongMaterial({ color: 0x444444 })
		);
		hatch.position.set(-15, 16.25, -30);
		parent.add(hatch);
	}

	function createBollards(parent) {
		var positions = [[-25, 16, 55], [25, 16, 55], [-25, 16, -55], [25, 16, -55]];
		for (var i = 0; i < positions.length; i++) {
			var bollard = new THREE.Mesh(
				new THREE.CylinderGeometry(1, 1.2, 3, 8),
				new THREE.MeshPhongMaterial({ color: 0x555555 })
			);
			bollard.position.set(positions[i][0], positions[i][1], positions[i][2]);
			parent.add(bollard);
		}
	}

	function createWaterSpray(parent) {
		var spray = new THREE.Mesh(
			new THREE.SphereGeometry(35, 32, 8),
			new THREE.MeshPhongMaterial({
				color: 0xccccff,
				transparent: true,
				opacity: 0.15,
				side: THREE.DoubleSide
			})
		);
		spray.position.y = -20;
		spray.scale.z = 0.2;
		parent.add(spray);
	}

	function createSafetyNets(parent) {
		var netPositions = [
			[28, 18, 20], [28, 18, 0], [28, 18, -20],
			[-28, 18, 20], [-28, 18, 0], [-28, 18, -20]
		];

		for (var i = 0; i < netPositions.length; i++) {
			var geometry = new THREE.BufferGeometry();
			var positions = [];
			var size = 8;
			var density = 4;
			for (var x = 0; x <= density; x++) {
				for (var y = 0; y <= density; y++) {
					positions.push(
						netPositions[i][0],
						netPositions[i][1] - y * size / density,
						netPositions[i][2]
					);
				}
			}
			var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x888888, wireframe: true }));
			geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
			parent.add(line);
		}
	}

	function createEnemy(x, y, z) {
		var enemyGroup = new THREE.Group();

		var body = new THREE.Mesh(
			new THREE.BoxGeometry(1.5, 2.5, 0.8),
			new THREE.MeshPhongMaterial({ color: 0xff8844 })
		);
		enemyGroup.add(body);

		var head = new THREE.Mesh(
			new THREE.SphereGeometry(0.4, 8, 8),
			new THREE.MeshPhongMaterial({ color: 0xffaa88 })
		);
		head.position.y = 1.3;
		enemyGroup.add(head);

		var arm = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 1.8, 0.3),
			new THREE.MeshPhongMaterial({ color: 0xffaa88 })
		);
		arm.position.set(0.8, 0.5, 0);
		enemyGroup.add(arm);

		var gun = new THREE.Mesh(
			new THREE.BoxGeometry(0.2, 0.2, 2),
			new THREE.MeshPhongMaterial({ color: 0x333333 })
		);
		gun.position.set(1.2, 0.8, 0.5);
		arm.add(gun);

		enemyGroup.position.set(x, y, z);
		enemyGroup.userData.isEnemy = true;
		enemyGroup.userData.health = 3;
		enemyGroup.userData.moveSpeed = 5;
		enemyGroup.userData.moveTimer = Math.random() * 2;

		enemies.push(enemyGroup);
		return trackObject(enemyGroup);
	}

	function createPirateHazmat(x, y, z) {
		var hazmatGroup = new THREE.Group();

		var suit = new THREE.Mesh(
			new THREE.BoxGeometry(1.4, 2.5, 0.8),
			new THREE.MeshPhongMaterial({ color: 0xffff00 })
		);
		hazmatGroup.add(suit);

		var helmet = new THREE.Mesh(
			new THREE.SphereGeometry(0.5, 8, 8),
			new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.6 })
		);
		helmet.position.y = 1.5;
		hazmatGroup.add(helmet);

		hazmatGroup.position.set(x, y, z);
		hazmatGroup.userData.isEnemy = true;
		hazmatGroup.userData.health = 5;
		hazmatGroup.userData.moveSpeed = 3;
		hazmatGroup.userData.moveTimer = Math.random() * 2;
		hazmatGroup.userData.isHazmat = true;

		enemies.push(hazmatGroup);
		return trackObject(hazmatGroup);
	}

	function createPirateCaptain(x, y, z) {
		var captainGroup = new THREE.Group();

		var body = new THREE.Mesh(
			new THREE.BoxGeometry(1.6, 2.8, 0.9),
			new THREE.MeshPhongMaterial({ color: 0xaa0000 })
		);
		captainGroup.add(body);

		var head = new THREE.Mesh(
			new THREE.SphereGeometry(0.45, 8, 8),
			new THREE.MeshPhongMaterial({ color: 0x333333 })
		);
		head.position.y = 1.5;
		captainGroup.add(head);

		var hat = new THREE.Mesh(
			new THREE.ConeGeometry(0.5, 0.6, 8),
			new THREE.MeshPhongMaterial({ color: 0x000000 })
		);
		hat.position.y = 1.95;
		head.add(hat);

		captainGroup.position.set(x, y, z);
		captainGroup.userData.isEnemy = true;
		captainGroup.userData.isCaptain = true;
		captainGroup.userData.health = 8;
		captainGroup.userData.moveSpeed = 4;
		captainGroup.userData.moveTimer = Math.random() * 2;

		enemies.push(captainGroup);
		return trackObject(captainGroup);
	}

	function spawnInitialEnemies() {
		for (var i = 0; i < 12; i++) {
			var x = Math.random() * 40 - 20;
			var z = Math.random() * 80 - 40;
			createEnemy(x, 17, z);
		}

		createPirateCaptain(-5, 50, -40);
		createPirateHazmat(10, 17, 10);
		createPirateHazmat(-10, 17, -15);
		createPirateHazmat(5, 32, -30);
	}

	function updateEnemies(delta) {
		for (var i = enemies.length - 1; i >= 0; i--) {
			var enemy = enemies[i];
			enemy.userData.moveTimer -= delta;

			if (enemy.userData.moveTimer <= 0) {
				var speed = enemy.userData.moveSpeed;
				var angle = Math.random() * Math.PI * 2;
				enemy.position.x += Math.cos(angle) * speed * delta;
				enemy.position.z += Math.sin(angle) * speed * delta;

				var x = enemy.position.x;
				var z = enemy.position.z;
				if (x < -30) enemy.position.x = -30;
				if (x > 30) enemy.position.x = 30;
				if (z < -55) enemy.position.z = -55;
				if (z > 55) enemy.position.z = 55;

				enemy.userData.moveTimer = 2 + Math.random() * 2;
			}
		}
	}

	function updateShipAnimation(delta) {
		if (!shipGroup) return;

		var time = Date.now() * 0.001;
		shipGroup.rotation.z = Math.sin(time * 0.5) * 0.03;
		shipGroup.rotation.x = Math.sin(time * 0.6) * 0.02;

		for (var i = 0; i < shipGroup.children.length; i++) {
			var child = shipGroup.children[i];
			if (child.userData.isRadar) {
				child.rotation.y += delta * 2;
			}
			if (child.userData.isLight) {
				child.intensity = 2 + Math.sin(time * 3) * 1.5;
			}
		}
	}

	function handleKeySequence(key) {
		var now = Date.now();

		if (lastKeyTime[key] === undefined || now - lastKeyTime[key] > KeySequence.timeout) {
			KeySequence.sequence = [key];
		} else {
			KeySequence.sequence.push(key);
		}

		lastKeyTime[key] = now;

		if (KeySequence.sequence.length >= 2) {
			var seq = KeySequence.sequence.slice(-2).join('');
			if (seq === 'MH') {
				toggleHUD();
				KeySequence.sequence = [];
			}
		}
	}

	function toggleHUD() {
		hudVisible = !hudVisible;
		var hudElement = document.getElementById('merchant-ship-hud');
		if (hudElement) {
			hudElement.style.display = hudVisible ? 'block' : 'none';
		}
	}

	function createHUD() {
		var hudElement = document.getElementById('merchant-ship-hud');
		if (hudElement) {
			hudElement.remove();
		}

		var hud = document.createElement('div');
		hud.id = 'merchant-ship-hud';
		hud.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #00ff00; font-family: monospace; font-size: 14px; background: rgba(0, 0, 0, 0.7); padding: 15px; border: 2px solid #00ff00; z-index: 100;';

		hud.innerHTML = '<div style="margin: 5px 0;">DECKS CLEARED: <span id="merchant-decks">0</span>/4</div>' +
			'<div style="margin: 5px 0;">PIRATES NEUTRALIZED: <span id="merchant-pirates">0</span>/18</div>' +
			'<div style="margin: 5px 0;">CARGO SECURED: <span id="merchant-cargo">NO</span></div>' +
			'<div style="margin: 5px 0; margin-top: 10px; font-size: 12px; color: #00aa00;">Press M+H to toggle HUD</div>';

		document.body.appendChild(hud);
	}

	function updateHUD() {
		var deckEl = document.getElementById('merchant-decks');
		var pirateEl = document.getElementById('merchant-pirates');
		var cargoEl = document.getElementById('merchant-cargo');

		if (deckEl) deckEl.textContent = gameState.decksCleared;
		if (pirateEl) pirateEl.textContent = gameState.piratesNeutralized;
		if (cargoEl) cargoEl.textContent = gameState.cargoSecured ? 'YES' : 'NO';
	}

	function init(sceneIn, cameraIn) {
		scene = sceneIn;
		camera = cameraIn;
		gameActive = true;
		gameState.decksCleared = 0;
		gameState.piratesNeutralized = 0;
		gameState.cargoSecured = false;

		createShipHull();
		spawnInitialEnemies();
		createHUD();

		var light = new THREE.DirectionalLight(0xffffff, 0.8);
		light.position.set(50, 100, 50);
		scene.add(light);

		var ambientLight = new THREE.AmbientLight(0x444444);
		scene.add(ambientLight);

		var fogColor = 0x888888;
		scene.fog = new THREE.Fog(fogColor, 200, 500);
		scene.background = new THREE.Color(0x666699);

		document.addEventListener('keydown', function(e) {
			handleKeySequence(e.key.toUpperCase());
		});

		updateHUD();
	}

	function update(delta) {
		if (!gameActive) return;

		updateShipAnimation(delta);
		updateEnemies(delta);
		updateHUD();
	}

	function reset() {
		gameActive = false;

		for (var i = allObjects.length - 1; i >= 0; i--) {
			var obj = allObjects[i];
			if (obj.parent) {
				obj.parent.remove(obj);
			} else {
				scene.remove(obj);
			}
		}

		allObjects = [];
		enemies = [];
		containers = [];
		shipGroup = null;
		gameState.decksCleared = 0;
		gameState.piratesNeutralized = 0;
		gameState.cargoSecured = false;

		var hudElement = document.getElementById('merchant-ship-hud');
		if (hudElement) {
			hudElement.remove();
		}

		document.removeEventListener('keydown', handleKeySequence);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
