window.RooftopChase = (function() {
	'use strict';

	var scene, camera;
	var sceneObjects = [];
	var hvtTarget = null;
	var hvtPath = [];
	var hvtPathIndex = 0;
	var hvtPathTime = 0;
	var hvtPathSegmentDuration = 2.0;
	var hvtSpeed = 50;

	var helicopterGroup = null;
	var helicopterTime = 0;
	var helicopterRotationTime = 0;
	var spotlightTarget = null;

	var hvacFans = [];
	var neonSign = null;
	var neonFlickerTime = 0;
	var cityLights = [];

	var gameState = {
		enabled: false,
		targetDistance: 250,
		bodyguardsEliminated: 0,
		hvtStatus: 'FLEEING',
		notificationTime: 0,
		notificationText: ''
	};

	var keyPressLog = [];
	var KEYBIND_TIMEOUT = 400;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		sceneObjects = [];
		hvtPathIndex = 0;
		hvtPathTime = 0;
		helicopterTime = 0;
		helicopterRotationTime = 0;
		neonFlickerTime = 0;
		gameState.bodyguardsEliminated = 0;
		gameState.hvtStatus = 'FLEEING';
		gameState.enabled = false;

		createRooftopEnvironment();
		createHVTTarget();
		createHelicopter();
		setupHVTPath();

		document.addEventListener('keydown', handleKeyDown);
	}

	function createRooftopEnvironment() {
		var fog = new THREE.Fog(0x0a0a1a, 100, 400);
		scene.fog = fog;
		scene.background = new THREE.Color(0x0a0a1a);

		// Main rooftop platform
		var mainRoofGeometry = new THREE.BoxGeometry(80, 2, 60);
		var mainRoofMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
		var mainRoof = new THREE.Mesh(mainRoofGeometry, mainRoofMaterial);
		mainRoof.position.set(0, 50, 0);
		mainRoof.castShadow = true;
		mainRoof.receiveShadow = true;
		scene.add(mainRoof);
		sceneObjects.push(mainRoof);

		// Second rooftop platform
		var secondRoofGeometry = new THREE.BoxGeometry(70, 2, 50);
		var secondRoofMaterial = new THREE.MeshStandardMaterial({ color: 0x16213e, roughness: 0.8 });
		var secondRoof = new THREE.Mesh(secondRoofGeometry, secondRoofMaterial);
		secondRoof.position.set(120, 65, 30);
		secondRoof.castShadow = true;
		secondRoof.receiveShadow = true;
		scene.add(secondRoof);
		sceneObjects.push(secondRoof);

		// Third rooftop platform
		var thirdRoofGeometry = new THREE.BoxGeometry(60, 2, 45);
		var thirdRoofMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
		var thirdRoof = new THREE.Mesh(thirdRoofGeometry, thirdRoofMaterial);
		thirdRoof.position.set(220, 55, 60);
		thirdRoof.castShadow = true;
		thirdRoof.receiveShadow = true;
		scene.add(thirdRoof);
		sceneObjects.push(thirdRoof);

		// Fourth rooftop platform
		var fourthRoofGeometry = new THREE.BoxGeometry(75, 2, 55);
		var fourthRoofMaterial = new THREE.MeshStandardMaterial({ color: 0x16213e, roughness: 0.8 });
		var fourthRoof = new THREE.Mesh(fourthRoofGeometry, fourthRoofMaterial);
		fourthRoof.position.set(340, 75, 20);
		fourthRoof.castShadow = true;
		fourthRoof.receiveShadow = true;
		scene.add(fourthRoof);
		sceneObjects.push(fourthRoof);

		// Gap bridge 1
		var bridge1Geometry = new THREE.BoxGeometry(8, 1, 30);
		var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 });
		var bridge1 = new THREE.Mesh(bridge1Geometry, bridgeMaterial);
		bridge1.position.set(60, 51, 15);
		bridge1.castShadow = true;
		bridge1.receiveShadow = true;
		scene.add(bridge1);
		sceneObjects.push(bridge1);

		// Gap bridge 2
		var bridge2Geometry = new THREE.BoxGeometry(10, 1, 25);
		var bridge2 = new THREE.Mesh(bridge2Geometry, bridgeMaterial);
		bridge2.position.set(170, 60, 45);
		bridge2.castShadow = true;
		bridge2.receiveShadow = true;
		scene.add(bridge2);
		sceneObjects.push(bridge2);

		// Gap bridge 3
		var bridge3Geometry = new THREE.BoxGeometry(9, 1, 28);
		var bridge3 = new THREE.Mesh(bridge3Geometry, bridgeMaterial);
		bridge3.position.set(280, 65, 35);
		bridge3.castShadow = true;
		bridge3.receiveShadow = true;
		scene.add(bridge3);
		sceneObjects.push(bridge3);

		// HVAC cooling units cluster 1
		var hvacGroup1 = new THREE.Group();
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 2; j++) {
				var hvacBoxGeometry = new THREE.BoxGeometry(8, 6, 8);
				var hvacMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7 });
				var hvacBox = new THREE.Mesh(hvacBoxGeometry, hvacMaterial);
				hvacBox.position.set(i * 10 - 10, 56, j * 10 - 5);
				hvacBox.castShadow = true;
				hvacBox.receiveShadow = true;
				hvacGroup1.add(hvacBox);
				sceneObjects.push(hvacBox);

				var fanGeometry = new THREE.CylinderGeometry(5, 5, 1, 32);
				var fanMaterial = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 });
				var fan = new THREE.Mesh(fanGeometry, fanMaterial);
				fan.position.set(i * 10 - 10, 62, j * 10 - 5);
				fan.castShadow = true;
				fan.receiveShadow = true;
				hvacGroup1.add(fan);
				hvacFans.push(fan);
				sceneObjects.push(fan);
			}
		}
		hvacGroup1.position.set(-25, 0, -20);
		scene.add(hvacGroup1);
		sceneObjects.push(hvacGroup1);

		// Elevator shaft housing
		var elevatorGeometry = new THREE.BoxGeometry(5, 8, 5);
		var elevatorMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
		var elevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
		elevator.position.set(30, 54, -10);
		elevator.castShadow = true;
		elevator.receiveShadow = true;
		scene.add(elevator);
		sceneObjects.push(elevator);

		// Water tower
		var waterTowerTankGeometry = new THREE.CylinderGeometry(8, 8, 12, 32);
		var waterTowerMaterial = new THREE.MeshStandardMaterial({ color: 0x444466, roughness: 0.7 });
		var waterTowerTank = new THREE.Mesh(waterTowerTankGeometry, waterTowerMaterial);
		waterTowerTank.position.set(-40, 65, -30);
		waterTowerTank.castShadow = true;
		waterTowerTank.receiveShadow = true;
		scene.add(waterTowerTank);
		sceneObjects.push(waterTowerTank);

		var waterTowerLegGeometry = new THREE.BoxGeometry(2, 15, 2);
		for (var i = 0; i < 4; i++) {
			var leg = new THREE.Mesh(waterTowerLegGeometry, elevatorMaterial);
			var angle = (i / 4) * Math.PI * 2;
			leg.position.set(-40 + Math.cos(angle) * 6, 50, -30 + Math.sin(angle) * 6);
			leg.castShadow = true;
			leg.receiveShadow = true;
			scene.add(leg);
			sceneObjects.push(leg);
		}

		// Skylight dome
		var skylightGeometry = new THREE.SphereGeometry(6, 32, 16);
		var skylightMaterial = new THREE.MeshStandardMaterial({ color: 0x333366, roughness: 0.3, metalness: 0.4 });
		var skylight = new THREE.Mesh(skylightGeometry, skylightMaterial);
		skylight.position.set(50, 56, 20);
		skylight.castShadow = true;
		skylight.receiveShadow = true;
		scene.add(skylight);
		sceneObjects.push(skylight);

		// Antenna/cell mast
		var mastGeometry = new THREE.CylinderGeometry(1, 1, 40, 16);
		var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.5 });
		var mast = new THREE.Mesh(mastGeometry, mastMaterial);
		mast.position.set(-50, 70, 25);
		mast.castShadow = true;
		mast.receiveShadow = true;
		scene.add(mast);
		sceneObjects.push(mast);

		// Mast cross-arms (LineSegments)
		var armPositions = [];
		armPositions.push(-50, 80, 25);
		armPositions.push(-50, 80, 35);
		armPositions.push(-50, 75, 25);
		armPositions.push(-40, 75, 25);
		armPositions.push(-50, 70, 25);
		armPositions.push(-50, 70, 20);
		var armGeometry = new THREE.BufferGeometry();
		armGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(armPositions), 3));
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x888899 });
		var armLines = new THREE.LineSegments(armGeometry, lineMaterial);
		scene.add(armLines);
		sceneObjects.push(armLines);

		// Solar panel arrays
		var solarPanelGeometry = new THREE.BoxGeometry(20, 0.5, 20);
		var solarMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a5a, roughness: 0.2, metalness: 0.6 });
		var solarPanel1 = new THREE.Mesh(solarPanelGeometry, solarMaterial);
		solarPanel1.position.set(100, 52.5, -15);
		solarPanel1.rotation.z = 0.3;
		solarPanel1.castShadow = true;
		solarPanel1.receiveShadow = true;
		scene.add(solarPanel1);
		sceneObjects.push(solarPanel1);

		var solarPanel2 = new THREE.Mesh(solarPanelGeometry, solarMaterial);
		solarPanel2.position.set(200, 57.5, 50);
		solarPanel2.rotation.z = -0.25;
		solarPanel2.castShadow = true;
		solarPanel2.receiveShadow = true;
		scene.add(solarPanel2);
		sceneObjects.push(solarPanel2);

		// Satellite dish
		var dishBaseGeometry = new THREE.CylinderGeometry(10, 10, 2, 32);
		var dishMaterial = new THREE.MeshStandardMaterial({ color: 0x555577, roughness: 0.4 });
		var dishBase = new THREE.Mesh(dishBaseGeometry, dishMaterial);
		dishBase.position.set(300, 57, -25);
		dishBase.castShadow = true;
		dishBase.receiveShadow = true;
		scene.add(dishBase);
		sceneObjects.push(dishBase);

		var dishConGeometry = new THREE.ConeGeometry(12, 15, 32);
		var dishCone = new THREE.Mesh(dishConGeometry, dishMaterial);
		dishCone.position.set(300, 72, -25);
		dishCone.castShadow = true;
		dishCone.receiveShadow = true;
		scene.add(dishCone);
		sceneObjects.push(dishCone);

		// Rooftop garden
		var gardenGeometry = new THREE.BoxGeometry(30, 0.5, 25);
		var gardenMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.8 });
		var garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
		garden.position.set(-60, 52.5, 30);
		garden.castShadow = true;
		garden.receiveShadow = true;
		scene.add(garden);
		sceneObjects.push(garden);

		var planterGeometry = new THREE.BoxGeometry(3, 2, 3);
		var planterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
		for (var i = 0; i < 5; i++) {
			var planter = new THREE.Mesh(planterGeometry, planterMaterial);
			planter.position.set(-70 + i * 8, 54, 25);
			planter.castShadow = true;
			planter.receiveShadow = true;
			scene.add(planter);
			sceneObjects.push(planter);
		}

		// Stairwell exit
		var stairwellGeometry = new THREE.BoxGeometry(6, 7, 6);
		var stairwellMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 });
		var stairwell = new THREE.Mesh(stairwellGeometry, stairwellMaterial);
		stairwell.position.set(70, 53.5, 35);
		stairwell.castShadow = true;
		stairwell.receiveShadow = true;
		scene.add(stairwell);
		sceneObjects.push(stairwell);

		// Air duct
		var ductGeometry = new THREE.CylinderGeometry(3, 3, 50, 16);
		var ductMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.7 });
		var duct = new THREE.Mesh(ductGeometry, ductMaterial);
		duct.position.set(150, 52, 0);
		duct.rotation.z = Math.PI / 2;
		duct.castShadow = true;
		duct.receiveShadow = true;
		scene.add(duct);
		sceneObjects.push(duct);

		// Helicopter landing pad
		var padGeometry = new THREE.BoxGeometry(25, 0.5, 25);
		var padMaterial = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9 });
		var pad = new THREE.Mesh(padGeometry, padMaterial);
		pad.position.set(350, 77.5, -40);
		pad.castShadow = true;
		pad.receiveShadow = true;
		scene.add(pad);
		sceneObjects.push(pad);

		var padLinePositions = [];
		padLinePositions.push(338, 78, -40);
		padLinePositions.push(362, 78, -40);
		padLinePositions.push(350, 78, -52);
		padLinePositions.push(350, 78, -28);
		var padLineGeometry = new THREE.BufferGeometry();
		padLineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(padLinePositions), 3));
		var padLines = new THREE.LineSegments(padLineGeometry, lineMaterial);
		scene.add(padLines);
		sceneObjects.push(padLines);

		// Neon sign on parapet
		neonSign = createNeonSign();
		neonSign.position.set(-80, 60, 0);
		scene.add(neonSign);
		sceneObjects.push(neonSign);

		// City below - dark building bases
		var cityBuildingGeometry = new THREE.BoxGeometry(200, 30, 150);
		var cityMaterial = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.9 });
		var cityBuilding = new THREE.Mesh(cityBuildingGeometry, cityMaterial);
		cityBuilding.position.set(150, 5, 50);
		cityBuilding.castShadow = true;
		cityBuilding.receiveShadow = true;
		scene.add(cityBuilding);
		sceneObjects.push(cityBuilding);

		var cityBuilding2 = new THREE.Mesh(cityBuildingGeometry, cityMaterial);
		cityBuilding2.position.set(-100, 10, 100);
		cityBuilding2.castShadow = true;
		cityBuilding2.receiveShadow = true;
		scene.add(cityBuilding2);
		sceneObjects.push(cityBuilding2);

		// City lights (pulsing)
		for (var i = 0; i < 20; i++) {
			var lightGeometry = new THREE.BoxGeometry(2, 2, 1);
			var lightMaterial = new THREE.MeshStandardMaterial({
				color: Math.random() > 0.5 ? 0xffff66 : 0xff6699,
				emissive: Math.random() > 0.5 ? 0xffff66 : 0xff6699,
				roughness: 0.3
			});
			var light = new THREE.Mesh(lightGeometry, lightMaterial);
			light.position.set(Math.random() * 400 - 200, 10 + Math.random() * 30, Math.random() * 300 - 100);
			scene.add(light);
			sceneObjects.push(light);
			cityLights.push({ mesh: light, baseIntensity: Math.random() * 2 + 1 });
		}

		// Lighting
		var ambientLight = new THREE.AmbientLight(0x1a1a3a, 0.4);
		scene.add(ambientLight);
		sceneObjects.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0x1a1a5a, 0.3);
		directionalLight.position.set(100, 150, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
		sceneObjects.push(directionalLight);

		var pointLight = new THREE.PointLight(0xff3366, 0.5, 200);
		pointLight.position.set(-80, 65, 0);
		scene.add(pointLight);
		sceneObjects.push(pointLight);
	}

	function createNeonSign() {
		var signGroup = new THREE.Group();

		var frameGeometry = new THREE.BoxGeometry(15, 8, 1);
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
		var frame = new THREE.Mesh(frameGeometry, frameMaterial);
		signGroup.add(frame);

		var panelGeometry = new THREE.BoxGeometry(13, 6, 0.5);
		var panelMaterial = new THREE.MeshStandardMaterial({
			color: 0xff00ff,
			emissive: 0xff00ff,
			roughness: 0.1
		});
		var panel = new THREE.Mesh(panelGeometry, panelMaterial);
		panel.position.z = 0.5;
		signGroup.add(panel);
		panel.userData.panelMaterial = panelMaterial;

		return signGroup;
	}

	function createHVTTarget() {
		var hvtGroup = new THREE.Group();

		var bodyGeometry = new THREE.BoxGeometry(2, 6, 2);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 3;
		hvtGroup.add(body);

		var headGeometry = new THREE.SphereGeometry(1, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa88, roughness: 0.6 });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.y = 7;
		hvtGroup.add(head);

		hvtGroup.position.set(0, 50, 0);
		scene.add(hvtGroup);
		sceneObjects.push(hvtGroup);
		hvtTarget = hvtGroup;
	}

	function createHelicopter() {
		helicopterGroup = new THREE.Group();

		var fuselageGeometry = new THREE.BoxGeometry(8, 3, 20);
		var fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.6 });
		var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
		fuselage.position.y = 0;
		helicopterGroup.add(fuselage);

		var rotorGeometry = new THREE.CylinderGeometry(15, 15, 0.5, 32);
		var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8, metalness: 0.2 });
		var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
		rotor.position.y = 4;
		rotor.userData.isRotor = true;
		helicopterGroup.add(rotor);

		var tailRotorGeometry = new THREE.CylinderGeometry(3, 3, 0.3, 16);
		var tailRotor = new THREE.Mesh(tailRotorGeometry, rotorMaterial);
		tailRotor.position.set(0, 2, 12);
		tailRotor.rotation.z = Math.PI / 2;
		tailRotor.userData.isTailRotor = true;
		helicopterGroup.add(tailRotor);

		var spotlightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
		var spotlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffdd, emissive: 0xffff99 });
		spotlightTarget = new THREE.Mesh(spotlightGeometry, spotlightMaterial);
		spotlightTarget.position.y = -3;
		helicopterGroup.add(spotlightTarget);

		helicopterGroup.position.set(200, 120, -100);
		scene.add(helicopterGroup);
		sceneObjects.push(helicopterGroup);
	}

	function setupHVTPath() {
		hvtPath = [
			new THREE.Vector3(0, 50, 0),
			new THREE.Vector3(120, 65, 30),
			new THREE.Vector3(220, 55, 60),
			new THREE.Vector3(340, 75, 20),
			new THREE.Vector3(400, 80, -50),
			new THREE.Vector3(300, 70, -100),
			new THREE.Vector3(100, 60, -80),
			new THREE.Vector3(0, 50, 0)
		];
	}

	function handleKeyDown(event) {
		if (event.key.toLowerCase() === 'r') {
			var now = Date.now();
			keyPressLog.push({ key: 'r', time: now });
			keyPressLog = keyPressLog.filter(function(k) { return now - k.time < KEYBIND_TIMEOUT; });

			if (event.key.toLowerCase() === 'r' && keyPressLog.length === 1) {
				var timeoutHandle = setTimeout(function() {
					keyPressLog = keyPressLog.filter(function(k) { return now - k.time < KEYBIND_TIMEOUT; });
				}, KEYBIND_TIMEOUT);
			}
		} else if (event.key.toLowerCase() === 'c') {
			var now = Date.now();
			var recentR = keyPressLog.filter(function(k) { return k.key === 'r' && now - k.time < KEYBIND_TIMEOUT; });

			if (recentR.length > 0) {
				gameState.enabled = !gameState.enabled;
				gameState.notificationText = gameState.enabled ? 'ROOFTOP CHASE ACTIVATED' : 'ROOFTOP CHASE DEACTIVATED';
				gameState.notificationTime = 3.0;
				keyPressLog = [];
			}
		}
	}

	function update(delta) {
		if (!gameState.enabled) {
			return;
		}

		hvtPathTime += delta;
		var segmentDuration = hvtPathSegmentDuration;

		if (hvtPathTime >= segmentDuration) {
			hvtPathTime -= segmentDuration;
			hvtPathIndex = (hvtPathIndex + 1) % hvtPath.length;
		}

		var currentPoint = hvtPath[hvtPathIndex];
		var nextPoint = hvtPath[(hvtPathIndex + 1) % hvtPath.length];
		var t = hvtPathTime / segmentDuration;

		hvtTarget.position.lerpVectors(currentPoint, nextPoint, t);

		// Update target distance (simplified, based on HVT Y position)
		gameState.targetDistance = 400 - hvtTarget.position.z * 1.5;
		if (gameState.targetDistance < 0) gameState.targetDistance = 50;

		// Rotate HVAC fans
		for (var i = 0; i < hvacFans.length; i++) {
			hvacFans[i].rotation.z += delta * 5;
		}

		// Update helicopter
		helicopterTime += delta;
		var helicopterAngle = (helicopterTime * 0.3) % (Math.PI * 2);
		var helicopterRadius = 150;
		helicopterGroup.position.x = 200 + Math.cos(helicopterAngle) * helicopterRadius;
		helicopterGroup.position.z = -100 + Math.sin(helicopterAngle) * helicopterRadius;

		// Spin helicopter rotors
		var rotors = helicopterGroup.children.filter(function(child) { return child.userData.isRotor; });
		rotors.forEach(function(rotor) {
			rotor.rotation.y += delta * 15;
		});

		var tailRotors = helicopterGroup.children.filter(function(child) { return child.userData.isTailRotor; });
		tailRotors.forEach(function(rotor) {
			rotor.rotation.x += delta * 20;
		});

		// Move spotlight toward HVT
		if (spotlightTarget && hvtTarget) {
			var direction = hvtTarget.position.clone().sub(helicopterGroup.position).normalize();
			spotlightTarget.position.copy(direction.multiplyScalar(50));
		}

		// Neon sign flicker
		neonFlickerTime += delta;
		if (neonSign && neonSign.children.length > 1) {
			var panel = neonSign.children[1];
			if (panel.userData.panelMaterial) {
				var flicker = Math.sin(neonFlickerTime * 6) * 0.5 + 0.5;
				panel.userData.panelMaterial.emissiveIntensity = flicker;
			}
		}

		// Pulse city lights
		for (var i = 0; i < cityLights.length; i++) {
			var cityLight = cityLights[i];
			var pulse = Math.sin(neonFlickerTime * 2 + i) * 0.5 + 0.5;
			cityLight.mesh.material.emissiveIntensity = pulse * cityLight.baseIntensity;
		}

		// Update HUD notification timer
		if (gameState.notificationTime > 0) {
			gameState.notificationTime -= delta;
		}
	}

	function reset() {
		// Remove all scene objects
		for (var i = 0; i < sceneObjects.length; i++) {
			var obj = sceneObjects[i];
			if (obj.geometry) {
				obj.geometry.dispose();
			}
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					obj.material.forEach(function(m) { m.dispose(); });
				} else {
					obj.material.dispose();
				}
			}
			scene.remove(obj);
		}
		sceneObjects = [];

		// Clear arrays
		hvacFans = [];
		cityLights = [];
		hvtPath = [];
		keyPressLog = [];

		// Reset state
		hvtTarget = null;
		helicopterGroup = null;
		neonSign = null;
		hvtPathIndex = 0;
		hvtPathTime = 0;
		helicopterTime = 0;
		helicopterRotationTime = 0;
		neonFlickerTime = 0;
		gameState.enabled = false;
		gameState.bodyguardsEliminated = 0;
		gameState.hvtStatus = 'FLEEING';

		// Remove event listeners
		document.removeEventListener('keydown', handleKeyDown);
	}

	// HUD helper (for debugging/reference - not directly displayed in Three.js scene)
	function getHUDText() {
		var distance = Math.max(0, Math.floor(gameState.targetDistance));
		return 'TARGET DISTANCE: ' + distance + 'm | ' +
			   'BODYGUARDS ELIMINATED: ' + gameState.bodyguardsEliminated + ' | ' +
			   'HVT STATUS: ' + gameState.hvtStatus +
			   (gameState.notificationTime > 0 ? ' | ' + gameState.notificationText : '');
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getHUDText: getHUDText,
		getGameState: function() { return gameState; }
	};
}());
