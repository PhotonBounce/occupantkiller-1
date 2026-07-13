window.EmbassyTakeover = (function() {
	'use strict';

	var scene, camera;
	var meshes = [];
	var materials = [];
	var hudElement = null;
	var hostagesSecured = 0;
	var terroristsEliminated = 0;
	var breachStatus = 'PENDING';

	// Animation state
	var terroristPatrols = [];
	var specialOpsTeam = [];
	var searchlights = [];
	var smokeGrenadesGroup = [];
	var helicopterBlades = [];
	var policeBarrierLights = [];

	// HUD key tracking for H+U toggle
	var keyStates = {};
	var lastHKeyTime = 0;

	function createColor(r, g, b) {
		return new THREE.Color(r / 255, g / 255, b / 255);
	}

	function addMesh(mesh) {
		meshes.push(mesh);
		scene.add(mesh);
		return mesh;
	}

	function createAndAddMaterial(color, emissive, emissiveIntensity) {
		var material = new THREE.MeshStandardMaterial({
			color: color,
			emissive: emissive || new THREE.Color(0x000000),
			emissiveIntensity: emissiveIntensity || 0
		});
		materials.push(material);
		return material;
	}

	// 1. Embassy Building
	function createEmbassyBuilding() {
		var brickColor = createColor(139, 90, 43);
		var stoneMaterial = createAndAddMaterial(brickColor);

		// Main building body - 3 stories
		var mainBody = new THREE.Mesh(
			new THREE.BoxGeometry(25, 20, 15),
			stoneMaterial
		);
		mainBody.position.set(0, 10, 0);
		mainBody.castShadow = true;
		mainBody.receiveShadow = true;
		addMesh(mainBody);

		// Windows - ground floor
		var glassColor = createColor(100, 150, 200);
		var glassMaterial = createAndAddMaterial(glassColor, glassColor, 0.3);

		for (var i = 0; i < 4; i++) {
			var winX = -10 + i * 7;
			var window1 = new THREE.Mesh(
				new THREE.BoxGeometry(3, 3, 0.1),
				glassMaterial
			);
			window1.position.set(winX, 4, 7.6);
			addMesh(window1);

			// Upper floor windows
			var window2 = new THREE.Mesh(
				new THREE.BoxGeometry(3, 3, 0.1),
				glassMaterial
			);
			window2.position.set(winX, 12, 7.6);
			addMesh(window2);
		}

		// Entrance columns
		var columnMaterial = createAndAddMaterial(createColor(200, 200, 200));
		for (var c = 0; c < 4; c++) {
			var colX = -8 + c * 5.3;
			var column = new THREE.Mesh(
				new THREE.BoxGeometry(1.5, 8, 1.5),
				columnMaterial
			);
			column.position.set(colX, 4, -7.3);
			column.castShadow = true;
			addMesh(column);
		}

		// Roof
		var roof = new THREE.Mesh(
			new THREE.BoxGeometry(25, 0.5, 15),
			stoneMaterial
		);
		roof.position.set(0, 20.25, 0);
		roof.castShadow = true;
		addMesh(roof);
	}

	// 2. Embassy Gate - wrought iron fence
	function createEmbassyGate() {
		var metalColor = createColor(50, 50, 50);
		var metalMaterial = createAndAddMaterial(metalColor);

		// Left gate segment
		var leftGate = new THREE.Mesh(
			new THREE.BoxGeometry(4, 4, 0.3),
			metalMaterial
		);
		leftGate.position.set(-5, 2, -12);
		leftGate.castShadow = true;
		addMesh(leftGate);

		// Right gate segment
		var rightGate = new THREE.Mesh(
			new THREE.BoxGeometry(4, 4, 0.3),
			metalMaterial
		);
		rightGate.position.set(5, 2, -12);
		rightGate.castShadow = true;
		addMesh(rightGate);

		// Fence segments left
		for (var i = 0; i < 3; i++) {
			var fenceLeft = new THREE.Mesh(
				new THREE.BoxGeometry(1, 3.5, 0.2),
				metalMaterial
			);
			fenceLeft.position.set(-20 + i * 5, 1.75, -12);
			addMesh(fenceLeft);
		}

		// Fence segments right
		for (var i = 0; i < 3; i++) {
			var fenceRight = new THREE.Mesh(
				new THREE.BoxGeometry(1, 3.5, 0.2),
				metalMaterial
			);
			fenceRight.position.set(20 - i * 5, 1.75, -12);
			addMesh(fenceRight);
		}
	}

	// 3. Armored Vehicles
	function createArmoredVehicles() {
		var vehicleColor = createColor(0, 0, 0);
		var vehicleMaterial = createAndAddMaterial(vehicleColor);

		var positions = [
			{ x: -15, z: 10 },
			{ x: 0, z: 15 },
			{ x: 15, z: 12 }
		];

		positions.forEach(function(pos) {
			// Vehicle body
			var body = new THREE.Mesh(
				new THREE.BoxGeometry(6, 3.5, 10),
				vehicleMaterial
			);
			body.position.set(pos.x, 1.75, pos.z);
			body.castShadow = true;
			addMesh(body);

			// Vehicle roof
			var roof = new THREE.Mesh(
				new THREE.BoxGeometry(5.5, 1.5, 7),
				vehicleMaterial
			);
			roof.position.set(pos.x, 3.5, pos.z);
			addMesh(roof);

			// Wheels
			for (var w = 0; w < 4; w++) {
				var wheelX = -2 + w * 1.3;
				var wheelZ = -3 + Math.floor(w / 2) * 6;
				var wheel = new THREE.Mesh(
					new THREE.CylinderGeometry(1, 1, 0.8, 16),
					createAndAddMaterial(createColor(30, 30, 30))
				);
				wheel.rotation.z = Math.PI / 2;
				wheel.position.set(pos.x + wheelX, 1, pos.z + wheelZ);
				addMesh(wheel);
			}
		});
	}

	// 4. Flagpole with flag colors
	function createFlagpole() {
		var poleMaterial = createAndAddMaterial(createColor(100, 100, 100));
		var pole = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.3, 12, 8),
			poleMaterial
		);
		pole.position.set(-20, 6, 0);
		pole.castShadow = true;
		addMesh(pole);

		// Flag at top
		var flagMaterial = createAndAddMaterial(createColor(220, 20, 60)); // Crimson
		var flag = new THREE.Mesh(
			new THREE.BoxGeometry(4, 2.5, 0.1),
			flagMaterial
		);
		flag.position.set(-18, 11.5, 0);
		addMesh(flag);
	}

	// 5. Terrorist Figures
	function createTerroristFigures() {
		var darkColor = createColor(20, 20, 30);
		var terroristMaterial = createAndAddMaterial(darkColor);

		var patrolPath = [
			{ x: -10, z: 5 },
			{ x: 10, z: 5 },
			{ x: 10, z: -5 },
			{ x: -10, z: -5 }
		];

		for (var i = 0; i < 5; i++) {
			var terroristGroup = new THREE.Object3D();

			// Body
			var body = new THREE.Mesh(
				new THREE.BoxGeometry(1, 2, 0.8),
				terroristMaterial
			);
			body.position.y = 1;
			body.castShadow = true;
			terroristGroup.add(body);

			// Head
			var head = new THREE.Mesh(
				new THREE.BoxGeometry(0.7, 0.8, 0.7),
				terroristMaterial
			);
			head.position.y = 2.8;
			terroristGroup.add(head);

			// Arm pose
			var arm = new THREE.Mesh(
				new THREE.BoxGeometry(0.3, 1.5, 0.3),
				terroristMaterial
			);
			arm.position.set(0.7, 1.5, 0);
			arm.rotation.z = Math.PI / 6;
			terroristGroup.add(arm);

			var startPathIndex = i % patrolPath.length;
			terroristGroup.position.copy(patrolPath[startPathIndex]);

			addMesh(terroristGroup);

			terroristPatrols.push({
				mesh: terroristGroup,
				pathIndex: startPathIndex,
				pathPositions: patrolPath,
				progress: 0,
				speed: 0.02
			});
		}
	}

	// 6. Hostage Figures
	function createHostages() {
		var lightColor = createColor(200, 150, 100);
		var hostageMaterial = createAndAddMaterial(lightColor);

		var hostagePositions = [
			{ x: 8, y: 12, z: 6 },
			{ x: -8, y: 12, z: 6 },
			{ x: 0, y: 12, z: 6 }
		];

		hostagePositions.forEach(function(pos) {
			var hostageGroup = new THREE.Object3D();

			// Body
			var body = new THREE.Mesh(
				new THREE.BoxGeometry(0.8, 1.5, 0.6),
				hostageMaterial
			);
			body.position.y = 0.75;
			hostageGroup.add(body);

			// Head
			var head = new THREE.Mesh(
				new THREE.BoxGeometry(0.5, 0.6, 0.5),
				hostageMaterial
			);
			head.position.y = 1.9;
			hostageGroup.add(head);

			// Cowering pose - bent arms
			var arm1 = new THREE.Mesh(
				new THREE.BoxGeometry(0.2, 1, 0.2),
				hostageMaterial
			);
			arm1.position.set(-0.5, 0.8, 0);
			arm1.rotation.z = Math.PI / 3;
			hostageGroup.add(arm1);

			hostageGroup.position.copy(pos);
			addMesh(hostageGroup);
		});
	}

	// 7. Special Ops Team
	function createSpecialOpsTeam() {
		var tacticColor = createColor(30, 30, 30);
		var tacticMaterial = createAndAddMaterial(tacticColor);

		var advancePositions = [
			{ x: -8, z: -25 },
			{ x: -3, z: -25 },
			{ x: 3, z: -25 },
			{ x: 8, z: -25 }
		];

		advancePositions.forEach(function(pos) {
			var opGroup = new THREE.Object3D();

			// Body
			var body = new THREE.Mesh(
				new THREE.BoxGeometry(0.9, 1.8, 0.7),
				tacticMaterial
			);
			body.position.y = 0.9;
			opGroup.add(body);

			// Head
			var head = new THREE.Mesh(
				new THREE.BoxGeometry(0.6, 0.7, 0.6),
				tacticMaterial
			);
			head.position.y = 2;
			opGroup.add(head);

			// Rifle pose
			var rifle = new THREE.Mesh(
				new THREE.BoxGeometry(0.2, 0.3, 2),
				createAndAddMaterial(createColor(60, 60, 60))
			);
			rifle.position.set(0.3, 1.2, 0.5);
			rifle.rotation.z = -Math.PI / 6;
			opGroup.add(rifle);

			opGroup.position.copy(pos);
			addMesh(opGroup);

			specialOpsTeam.push({
				mesh: opGroup,
				targetZ: 5,
				baseZ: pos.z,
				speed: 0.08
			});
		});
	}

	// 8. Sniper Positions - sandbag walls and prone figures
	function createSniperPositions() {
		var sandColor = createColor(180, 150, 90);
		var sandMaterial = createAndAddMaterial(sandColor);

		var sniperPositions = [
			{ x: -15, z: -5 },
			{ x: 15, z: -5 }
		];

		sniperPositions.forEach(function(pos) {
			// Sandbag wall - stacked boxes
			for (var row = 0; row < 3; row++) {
				for (var col = 0; col < 4; col++) {
					var bag = new THREE.Mesh(
						new THREE.BoxGeometry(1.2, 0.6, 0.8),
						sandMaterial
					);
					bag.position.set(
						pos.x + col * 1.2 - 1.8,
						0.3 + row * 0.65,
						pos.z
					);
					addMesh(bag);
				}
			}

			// Prone sniper figure
			var sniperBody = new THREE.Mesh(
				new THREE.BoxGeometry(0.7, 0.5, 1.5),
				createAndAddMaterial(createColor(20, 20, 20))
			);
			sniperBody.position.set(pos.x, 1.5, pos.z - 1);
			sniperBody.rotation.z = Math.PI / 8;
			addMesh(sniperBody);

			// Scope rifle
			var scope = new THREE.Mesh(
				new THREE.BoxGeometry(0.15, 0.15, 2.5),
				createAndAddMaterial(createColor(40, 40, 40))
			);
			scope.position.set(pos.x + 0.2, 1.8, pos.z - 2);
			addMesh(scope);
		});
	}

	// 9. Embassy Garden
	function createGarden() {
		var greenColor = createColor(34, 139, 34);
		var greenMaterial = createAndAddMaterial(greenColor);

		// Decorative hedges
		var hedgePositions = [
			{ x: -12, z: 10 },
			{ x: -6, z: 12 },
			{ x: 6, z: 12 },
			{ x: 12, z: 10 }
		];

		hedgePositions.forEach(function(pos) {
			var hedge = new THREE.Mesh(
				new THREE.BoxGeometry(3, 2, 2.5),
				greenMaterial
			);
			hedge.position.copy(pos);
			addMesh(hedge);
		});

		// Stone fountain
		var stoneMaterial = createAndAddMaterial(createColor(160, 160, 150));
		var fountainBase = new THREE.Mesh(
			new THREE.CylinderGeometry(3, 3.5, 0.8, 16),
			stoneMaterial
		);
		fountainBase.position.set(0, 0.4, 8);
		addMesh(fountainBase);

		var fountainBowl = new THREE.Mesh(
			new THREE.CylinderGeometry(2.5, 2.8, 0.5, 16),
			stoneMaterial
		);
		fountainBowl.position.set(0, 1.2, 8);
		addMesh(fountainBowl);

		// Benches
		var benchMaterial = createAndAddMaterial(createColor(100, 80, 60));
		for (var b = 0; b < 2; b++) {
			var bench = new THREE.Mesh(
				new THREE.BoxGeometry(4, 1, 1.5),
				benchMaterial
			);
			bench.position.set(-8 + b * 16, 0.5, 10);
			addMesh(bench);
		}
	}

	// 10. Police Barricade Lines
	function createPoliceBarricades() {
		var policeBlue = createColor(0, 51, 102);
		var policeWhite = createColor(255, 255, 255);
		var policeBlueMaterial = createAndAddMaterial(policeBlue);
		var policeWhiteMaterial = createAndAddMaterial(policeWhite);

		var barricadeRows = [
			{ z: -18 },
			{ z: -22 }
		];

		barricadeRows.forEach(function(row) {
			for (var i = 0; i < 3; i++) {
				var carX = -12 + i * 12;

				// Police car body
				var carBody = new THREE.Mesh(
					new THREE.BoxGeometry(4.5, 1.8, 9),
					policeBlueMaterial
				);
				carBody.position.set(carX, 0.9, row.z);
				carBody.castShadow = true;
				addMesh(carBody);

				// Police car roof
				var carRoof = new THREE.Mesh(
					new THREE.BoxGeometry(4, 1, 5.5),
					policeBlueMaterial
				);
				carRoof.position.set(carX, 2.5, row.z);
				addMesh(carRoof);

				// Light bar - emissive red/blue
				var lightBar = new THREE.Mesh(
					new THREE.BoxGeometry(4.2, 0.3, 0.5),
					createAndAddMaterial(
						policeBlue,
						new THREE.Color(0xff0000),
						0.5
					)
				);
				lightBar.position.set(carX, 3.2, row.z);
				addMesh(lightBar);

				policeBarrierLights.push(lightBar);
			}
		});
	}

	// 11. Helicopter Landing Pad
	function createHeliPad() {
		var metalGray = createColor(100, 100, 100);
		var metalMaterial = createAndAddMaterial(metalGray);

		// H-shaped landing pad using flat boxes
		// Horizontal bar
		var horizBar = new THREE.Mesh(
			new THREE.BoxGeometry(5, 0.1, 2),
			metalMaterial
		);
		horizBar.position.set(15, 20.3, -10);
		addMesh(horizBar);

		// Left vertical bar
		var leftVert = new THREE.Mesh(
			new THREE.BoxGeometry(2, 0.1, 5),
			metalMaterial
		);
		leftVert.position.set(12.5, 20.3, -10);
		addMesh(leftVert);

		// Right vertical bar
		var rightVert = new THREE.Mesh(
			new THREE.BoxGeometry(2, 0.1, 5),
			metalMaterial
		);
		rightVert.position.set(17.5, 20.3, -10);
		addMesh(rightVert);

		// Helicopter blades - spinning
		var bladeGroup = new THREE.Object3D();
		bladeGroup.position.set(15, 21, -10);

		for (var blade = 0; blade < 2; blade++) {
			var bladeBox = new THREE.Mesh(
				new THREE.BoxGeometry(0.5, 0.1, 6),
				createAndAddMaterial(createColor(80, 80, 80))
			);
			bladeBox.rotation.z = blade * Math.PI / 2;
			bladeGroup.add(bladeBox);
		}

		addMesh(bladeGroup);
		helicopterBlades.push(bladeGroup);
	}

	// 12. Emergency Stairwell
	function createStairwell() {
		var metalGray = createColor(80, 80, 80);
		var metalMaterial = createAndAddMaterial(metalGray);

		// Exterior stairs on side
		for (var step = 0; step < 8; step++) {
			var stair = new THREE.Mesh(
				new THREE.BoxGeometry(2, 0.3, 1.5),
				metalMaterial
			);
			stair.position.set(
				20,
				0.5 + step * 1.2,
				0 + step * 0.3
			);
			stair.castShadow = true;
			addMesh(stair);
		}

		// Railing posts
		for (var post = 0; post < 8; post++) {
			var railPost = new THREE.Mesh(
				new THREE.BoxGeometry(0.3, 1, 0.3),
				metalMaterial
			);
			railPost.position.set(
				21.2,
				1.5 + post * 1.2,
				0.5 + post * 0.3
			);
			addMesh(railPost);
		}
	}

	// 13. Perimeter Walls
	function createPerimeterWalls() {
		var stoneMaterial = createAndAddMaterial(createColor(140, 120, 100));

		var wallSegments = [
			{ x: -25, z: 0, width: 1, depth: 30 },
			{ x: 25, z: 0, width: 1, depth: 30 },
			{ x: 0, z: 15, width: 50, depth: 1 },
			{ x: 0, z: -15, width: 50, depth: 1 }
		];

		wallSegments.forEach(function(seg) {
			var wall = new THREE.Mesh(
				new THREE.BoxGeometry(seg.width, 3, seg.depth),
				stoneMaterial
			);
			wall.position.set(seg.x, 1.5, seg.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			addMesh(wall);
		});
	}

	// 14. Search Floodlights
	function createFloodlights() {
		var poleMaterial = createAndAddMaterial(createColor(50, 50, 50));
		var lightMaterial = createAndAddMaterial(
			new THREE.Color(0xffffff),
			new THREE.Color(0xffff88),
			0.6
		);

		var lightPositions = [
			{ x: -18, z: -20 },
			{ x: 18, z: -20 }
		];

		lightPositions.forEach(function(pos) {
			// Pole
			var pole = new THREE.Mesh(
				new THREE.CylinderGeometry(0.4, 0.4, 10, 8),
				poleMaterial
			);
			pole.position.set(pos.x, 5, pos.z);
			pole.castShadow = true;
			addMesh(pole);

			// Light sphere
			var lightSphere = new THREE.Mesh(
				new THREE.SphereGeometry(1, 8, 8),
				lightMaterial
			);
			lightSphere.position.set(pos.x, 10, pos.z);
			addMesh(lightSphere);

			searchlights.push({
				mesh: lightSphere,
				startAngle: pos.x < 0 ? 0 : Math.PI,
				centerX: pos.x
			});
		});
	}

	// 15. Smoke Grenades
	function createSmokeGrenades() {
		var smokePositions = [
			{ x: -12, z: -15 },
			{ x: -6, z: -18 },
			{ x: 6, z: -18 },
			{ x: 12, z: -15 }
		];

		smokePositions.forEach(function(pos) {
			var smokeGroup = new THREE.Object3D();

			// 3 smoke clouds per grenade
			for (var cloud = 0; cloud < 3; cloud++) {
				var smokeMaterial = createAndAddMaterial(
					new THREE.Color(0xcccccc),
					new THREE.Color(0x666666),
					0.4
				);
				var smoke = new THREE.Mesh(
					new THREE.SphereGeometry(1.5 + cloud * 0.5, 4, 4),
					smokeMaterial
				);
				smoke.position.set(cloud - 1, 1 + cloud * 0.3, 0);
				smokeGroup.add(smoke);
			}

			smokeGroup.position.copy(pos);
			addMesh(smokeGroup);

			smokeGrenadesGroup.push({
				mesh: smokeGroup,
				baseScale: 1,
				time: 0
			});
		});
	}

	// 16. Communications Antenna
	function createAntenna() {
		var metalMaterial = createAndAddMaterial(createColor(80, 80, 80));

		// Antenna pole on roof
		var antennaPole = new THREE.Mesh(
			new THREE.CylinderGeometry(0.2, 0.2, 6, 8),
			metalMaterial
		);
		antennaPole.position.set(-18, 24, -5);
		antennaPole.castShadow = true;
		addMesh(antennaPole);

		// Satellite dish
		var dishMaterial = createAndAddMaterial(createColor(120, 120, 120));
		var dish = new THREE.Mesh(
			new THREE.ConeGeometry(2, 1.5, 16),
			dishMaterial
		);
		dish.rotation.x = -Math.PI / 3;
		dish.position.set(-18, 26, -5);
		addMesh(dish);
	}

	// Create HUD
	function createHUD() {
		if (hudElement) return;

		hudElement = document.createElement('div');
		hudElement.id = 'embassy-hud';
		hudElement.style.cssText = 'position:absolute; top:20px; left:20px; color:#00ff00; font-family:monospace; font-size:14px; background:rgba(0,0,0,0.7); padding:10px; border:1px solid #00ff00; z-index:1000;';
		hudElement.innerHTML = 'HOSTAGES SECURED: ' + hostagesSecured + '/3<br/>TERRORISTS ELIMINATED: ' + terroristsEliminated + '/5<br/>BREACH STATUS: ' + breachStatus;

		document.body.appendChild(hudElement);
	}

	function updateHUD() {
		if (hudElement) {
			hudElement.innerHTML = 'HOSTAGES SECURED: ' + hostagesSecured + '/3<br/>TERRORISTS ELIMINATED: ' + terroristsEliminated + '/5<br/>BREACH STATUS: ' + breachStatus;
		}
	}

	function removeHUD() {
		if (hudElement && hudElement.parentNode) {
			hudElement.parentNode.removeChild(hudElement);
			hudElement = null;
		}
	}

	// Keyboard handler for HUD toggle (H + U within 400ms)
	function setupHUDToggle() {
		document.addEventListener('keydown', function(e) {
			var key = e.key.toUpperCase();
			keyStates[key] = true;

			if (key === 'H') {
				lastHKeyTime = Date.now();
			}

			if (key === 'U' && keyStates['H']) {
				var timeDiff = Date.now() - lastHKeyTime;
				if (timeDiff < 400) {
					if (hudElement && hudElement.parentNode) {
						removeHUD();
					} else {
						createHUD();
					}
				}
			}
		});

		document.addEventListener('keyup', function(e) {
			var key = e.key.toUpperCase();
			keyStates[key] = false;
		});
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		// Create ground
		var groundMaterial = createAndAddMaterial(createColor(50, 150, 50));
		var ground = new THREE.Mesh(
			new THREE.BoxGeometry(100, 0.5, 60),
			groundMaterial
		);
		ground.position.y = -0.25;
		ground.receiveShadow = true;
		addMesh(ground);

		// Build all elements
		createEmbassyBuilding();
		createEmbassyGate();
		createArmoredVehicles();
		createFlagpole();
		createTerroristFigures();
		createHostages();
		createSpecialOpsTeam();
		createSniperPositions();
		createGarden();
		createPoliceBarricades();
		createHeliPad();
		createStairwell();
		createPerimeterWalls();
		createFloodlights();
		createSmokeGrenades();
		createAntenna();

		// Lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(20, 30, 20);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);

		createHUD();
		setupHUDToggle();
	}

	function update(delta) {
		// Update terrorist patrols
		terroristPatrols.forEach(function(patrol) {
			patrol.progress += patrol.speed * delta;

			if (patrol.progress >= 1) {
				patrol.progress = 0;
				patrol.pathIndex = (patrol.pathIndex + 1) % patrol.pathPositions.length;
			}

			var currentPos = patrol.pathPositions[patrol.pathIndex];
			var nextPos = patrol.pathPositions[(patrol.pathIndex + 1) % patrol.pathPositions.length];

			patrol.mesh.position.x = currentPos.x + (nextPos.x - currentPos.x) * patrol.progress;
			patrol.mesh.position.z = currentPos.z + (nextPos.z - currentPos.z) * patrol.progress;
		});

		// Update special ops team advance
		specialOpsTeam.forEach(function(op) {
			if (op.mesh.position.z < op.targetZ) {
				op.mesh.position.z += op.speed * delta;
			}
		});

		// Update searchlight sweep
		searchlights.forEach(function(light) {
			light.mesh.parent.rotation.y += 0.5 * delta;
		});

		// Update smoke grenade pulsing
		smokeGrenadesGroup.forEach(function(smoke) {
			smoke.time += delta;
			var pulse = 0.8 + 0.3 * Math.sin(smoke.time * 2);
			smoke.mesh.scale.set(pulse, pulse, pulse);
			smoke.mesh.children.forEach(function(child) {
				child.material.opacity = 0.5 + 0.3 * Math.sin(smoke.time * 3);
			});
		});

		// Update helicopter blades
		helicopterBlades.forEach(function(blade) {
			blade.rotation.z += 3 * delta;
		});

		// Update police light bars alternating
		var lightPhase = Math.sin(Date.now() * 0.005);
		policeBarrierLights.forEach(function(light, index) {
			if (index % 2 === 0) {
				light.material.emissive.setHex(lightPhase > 0 ? 0xff0000 : 0x0000ff);
			} else {
				light.material.emissive.setHex(lightPhase > 0 ? 0x0000ff : 0xff0000);
			}
		});
	}

	function reset() {
		// Remove HUD
		removeHUD();

		// Dispose all meshes
		meshes.forEach(function(mesh) {
			if (mesh.geometry) mesh.geometry.dispose();
			if (mesh.children) {
				mesh.children.forEach(function(child) {
					if (child.geometry) child.geometry.dispose();
				});
			}
		});

		// Dispose all materials
		materials.forEach(function(material) {
			material.dispose();
		});

		// Remove from scene
		meshes.forEach(function(mesh) {
			if (mesh.parent === scene) {
				scene.remove(mesh);
			}
		});

		// Clear arrays
		meshes = [];
		materials = [];
		terroristPatrols = [];
		specialOpsTeam = [];
		searchlights = [];
		smokeGrenadesGroup = [];
		helicopterBlades = [];
		policeBarrierLights = [];

		// Reset state
		hostagesSecured = 0;
		terroristsEliminated = 0;
		breachStatus = 'PENDING';
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
