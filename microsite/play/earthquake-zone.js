window.EarthquakeZone = (function() {
	'use strict';

	var scene, camera;
	var sceneObjects = {};
	var animations = {};
	var time = 0;
	var survivors = 0;
	var lootersCount = 4;
	var hudElement;
	var keyBuffer = [];
	var lastKeyTime = 0;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		// Create HUD
		createHUD();

		// 1. Cracked street ground
		var groundGeometry = new THREE.BoxGeometry(400, 0.3, 400);
		var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.set(0, 0, 0);
		ground.castShadow = true;
		ground.receiveShadow = true;
		scene.add(ground);
		sceneObjects.ground = ground;

		// 2. Fault line crack running diagonally
		var faultGeometry = new THREE.BoxGeometry(500, 0.15, 10);
		var faultMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var fault = new THREE.Mesh(faultGeometry, faultMaterial);
		fault.position.set(0, 0.08, 0);
		fault.rotation.z = Math.PI / 4;
		fault.castShadow = true;
		scene.add(fault);
		sceneObjects.fault = fault;

		// 3a. First partially collapsed building
		var building1Group = new THREE.Group();
		building1Group.position.set(-80, 0, -100);

		var mainWall1 = new THREE.Mesh(
			new THREE.BoxGeometry(40, 60, 30),
			new THREE.MeshStandardMaterial({ color: 0x8B7355 })
		);
		mainWall1.castShadow = true;
		mainWall1.receiveShadow = true;
		building1Group.add(mainWall1);

		var fallenSection1 = new THREE.Mesh(
			new THREE.BoxGeometry(35, 40, 25),
			new THREE.MeshStandardMaterial({ color: 0x654321 })
		);
		fallenSection1.position.set(5, 20, 5);
		fallenSection1.rotation.z = -0.4;
		fallenSection1.castShadow = true;
		building1Group.add(fallenSection1);

		scene.add(building1Group);
		sceneObjects.building1 = building1Group;

		// 3b. Second partially collapsed building
		var building2Group = new THREE.Group();
		building2Group.position.set(100, 0, -120);

		var mainWall2 = new THREE.Mesh(
			new THREE.BoxGeometry(50, 70, 35),
			new THREE.MeshStandardMaterial({ color: 0x9B8B7E })
		);
		mainWall2.castShadow = true;
		mainWall2.receiveShadow = true;
		building2Group.add(mainWall2);

		var fallenSection2 = new THREE.Mesh(
			new THREE.BoxGeometry(45, 50, 30),
			new THREE.MeshStandardMaterial({ color: 0x705040 })
		);
		fallenSection2.position.set(-10, 25, -8);
		fallenSection2.rotation.z = 0.35;
		fallenSection2.castShadow = true;
		building2Group.add(fallenSection2);

		scene.add(building2Group);
		sceneObjects.building2 = building2Group;

		// 4. Rubble pile - 20 irregular boxes
		var rubbleGroup = new THREE.Group();
		rubbleGroup.position.set(0, 0, 60);
		for (var i = 0; i < 20; i++) {
			var rubbleSize = 2 + Math.random() * 8;
			var rubble = new THREE.Mesh(
				new THREE.BoxGeometry(rubbleSize, rubbleSize * 0.8, rubbleSize),
				new THREE.MeshStandardMaterial({ color: 0x555555 + Math.floor(Math.random() * 0x111111) })
			);
			rubble.position.set(
				(Math.random() - 0.5) * 50,
				i * 1.5 + Math.random() * 3,
				(Math.random() - 0.5) * 40
			);
			rubble.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);
			rubble.castShadow = true;
			rubble.receiveShadow = true;
			rubbleGroup.add(rubble);
		}
		scene.add(rubbleGroup);
		sceneObjects.rubble = rubbleGroup;

		// 5. Collapsed section of road - angled flat box
		var collapsedRoadGeometry = new THREE.BoxGeometry(150, 0.2, 80);
		var collapsedRoadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
		var collapsedRoad = new THREE.Mesh(collapsedRoadGeometry, collapsedRoadMaterial);
		collapsedRoad.position.set(-120, -5, 120);
		collapsedRoad.rotation.z = 0.3;
		collapsedRoad.castShadow = true;
		collapsedRoad.receiveShadow = true;
		scene.add(collapsedRoad);
		sceneObjects.collapsedRoad = collapsedRoad;

		// 6. USAR rescue team (4 figures)
		var usarGroup = new THREE.Group();
		var usarPositions = [
			{ x: 5, z: 65 },
			{ x: -10, z: 70 },
			{ x: 15, z: 72 },
			{ x: -5, z: 60 }
		];
		for (var i = 0; i < 4; i++) {
			var usar = createFigure(0xFF8800); // orange
			usar.position.set(usarPositions[i].x, 0.5, usarPositions[i].z);
			usarGroup.add(usar);
		}
		scene.add(usarGroup);
		sceneObjects.usar = usarGroup;

		// 7. National Guard soldiers (3 figures)
		var guardGroup = new THREE.Group();
		var guardPositions = [
			{ x: -150, z: 0 },
			{ x: -140, z: 20 },
			{ x: -135, z: -15 }
		];
		for (var i = 0; i < 3; i++) {
			var guard = createFigure(0x228B22); // green
			guard.position.set(guardPositions[i].x, 0.5, guardPositions[i].z);
			guardGroup.add(guard);
		}
		scene.add(guardGroup);
		sceneObjects.guards = guardGroup;

		// 8. Looter figures (4 figures)
		var lootersGroup = new THREE.Group();
		var looterPositions = [
			{ x: 150, z: 0 },
			{ x: 160, z: 15 },
			{ x: 145, z: -10 },
			{ x: 155, z: -20 }
		];
		for (var i = 0; i < 4; i++) {
			var looter = createFigure(0x2a2a2a); // dark
			looter.position.set(looterPositions[i].x, 0.5, looterPositions[i].z);
			lootersGroup.add(looter);
		}
		scene.add(lootersGroup);
		sceneObjects.looters = lootersGroup;

		// 9. Gas pipe explosion
		var explosionGroup = new THREE.Group();
		explosionGroup.position.set(50, 0.5, -80);
		for (var i = 0; i < 3; i++) {
			var fireball = new THREE.Mesh(
				new THREE.SphereGeometry(2 + i * 1.5, 8, 8),
				new THREE.MeshBasicMaterial({ color: 0xFF6600 })
			);
			fireball.position.y = i * 3;
			explosionGroup.add(fireball);
		}
		scene.add(explosionGroup);
		sceneObjects.explosion = explosionGroup;

		// 10a. First broken fire hydrant
		var hydrant1Group = new THREE.Group();
		hydrant1Group.position.set(-60, 0, 40);
		var hydrant1Body = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 2, 4, 8),
			new THREE.MeshStandardMaterial({ color: 0xFF0000 })
		);
		hydrant1Body.castShadow = true;
		hydrant1Group.add(hydrant1Body);
		var waterSpray1 = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 8, 0.3),
			new THREE.MeshBasicMaterial({ color: 0x00CCFF, emissive: 0x0099FF })
		);
		waterSpray1.position.set(0, 4, 0);
		waterSpray1.rotation.z = 0.4;
		hydrant1Group.add(waterSpray1);
		scene.add(hydrant1Group);
		sceneObjects.hydrant1 = hydrant1Group;

		// 10b. Second broken fire hydrant
		var hydrant2Group = new THREE.Group();
		hydrant2Group.position.set(80, 0, 100);
		var hydrant2Body = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 2, 4, 8),
			new THREE.MeshStandardMaterial({ color: 0xFF0000 })
		);
		hydrant2Body.castShadow = true;
		hydrant2Group.add(hydrant2Body);
		var waterSpray2 = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 8, 0.3),
			new THREE.MeshBasicMaterial({ color: 0x00CCFF, emissive: 0x0099FF })
		);
		waterSpray2.position.set(0, 4, 0);
		waterSpray2.rotation.z = -0.5;
		hydrant2Group.add(waterSpray2);
		scene.add(hydrant2Group);
		sceneObjects.hydrant2 = hydrant2Group;

		// 11. Telephone pole fallen
		var poleGroup = new THREE.Group();
		poleGroup.position.set(-100, 0, 0);
		var poleBody = new THREE.Mesh(
			new THREE.CylinderGeometry(0.8, 0.8, 60, 8),
			new THREE.MeshStandardMaterial({ color: 0x8B7355 })
		);
		poleBody.rotation.z = Math.PI / 3;
		poleBody.castShadow = true;
		poleGroup.add(poleBody);

		var wireBox = new THREE.Mesh(
			new THREE.BoxGeometry(0.2, 50, 0.2),
			new THREE.MeshStandardMaterial({ color: 0x555555 })
		);
		wireBox.position.set(20, 10, 0);
		wireBox.rotation.z = 0.15;
		poleGroup.add(wireBox);
		scene.add(poleGroup);
		sceneObjects.pole = poleGroup;

		// 12. Abandoned car cluster (3 vehicles)
		var carPositions = [
			{ x: 120, z: -60 },
			{ x: 135, z: -50 },
			{ x: 110, z: -45 }
		];
		var carsGroup = new THREE.Group();
		for (var i = 0; i < 3; i++) {
			var car = createCar();
			car.position.set(carPositions[i].x, 0, carPositions[i].z);
			if (i === 2) car.scale.y = 0.6; // crushed
			carsGroup.add(car);
		}
		scene.add(carsGroup);
		sceneObjects.cars = carsGroup;

		// 13. Emergency triage tent
		var tentGroup = new THREE.Group();
		tentGroup.position.set(-50, 0, -60);
		var tentBody = new THREE.Mesh(
			new THREE.BoxGeometry(40, 20, 40),
			new THREE.MeshStandardMaterial({ color: 0xCC0000 })
		);
		tentBody.castShadow = true;
		tentGroup.add(tentBody);

		var redCross = new THREE.Mesh(
			new THREE.BoxGeometry(15, 0.5, 3),
			new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
		);
		redCross.position.y = 10;
		tentGroup.add(redCross);

		var redCrossVert = new THREE.Mesh(
			new THREE.BoxGeometry(3, 0.5, 15),
			new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
		);
		redCrossVert.position.y = 10;
		tentGroup.add(redCrossVert);

		var injuredCivilian = createFigure(0xFFCC99);
		injuredCivilian.position.set(0, 5, 0);
		tentGroup.add(injuredCivilian);

		scene.add(tentGroup);
		sceneObjects.tent = tentGroup;

		// 14. Helicopter overhead
		var helicopterGroup = new THREE.Group();
		helicopterGroup.position.set(0, 80, 0);

		var helicopterBody = new THREE.Mesh(
			new THREE.BoxGeometry(8, 4, 15),
			new THREE.MeshStandardMaterial({ color: 0x333333 })
		);
		helicopterBody.castShadow = true;
		helicopterGroup.add(helicopterBody);

		var rotor = new THREE.Mesh(
			new THREE.BoxGeometry(25, 0.3, 3),
			new THREE.MeshStandardMaterial({ color: 0x666666 })
		);
		rotor.position.y = 2;
		helicopterGroup.add(rotor);

		scene.add(helicopterGroup);
		sceneObjects.helicopter = helicopterGroup;
		animations.helicopter = { rotation: 0 };

		// 15. Dust/smoke column
		var dustGroup = new THREE.Group();
		dustGroup.position.set(20, 0, 80);
		for (var i = 0; i < 5; i++) {
			var dustBox = new THREE.Mesh(
				new THREE.BoxGeometry(30 - i * 4, 30 + i * 8, 30 - i * 4),
				new THREE.MeshStandardMaterial({
					color: 0xCCCCCC,
					transparent: true,
					opacity: 0.4 - i * 0.06
				})
			);
			dustBox.position.y = i * 20;
			dustGroup.add(dustBox);
		}
		scene.add(dustGroup);
		sceneObjects.dust = dustGroup;

		// 16. Emergency siren truck
		var truckGroup = new THREE.Group();
		truckGroup.position.set(-180, 0, -80);

		var truckBody = new THREE.Mesh(
			new THREE.BoxGeometry(15, 10, 30),
			new THREE.MeshStandardMaterial({ color: 0xFF0000 })
		);
		truckBody.castShadow = true;
		truckGroup.add(truckBody);

		var sirenLight = new THREE.Mesh(
			new THREE.SphereGeometry(1.5, 16, 16),
			new THREE.MeshBasicMaterial({
				color: 0xFF0000,
				emissive: 0xFF0000
			})
		);
		sirenLight.position.set(0, 5.5, 0);
		truckGroup.add(sirenLight);

		scene.add(truckGroup);
		sceneObjects.truck = truckGroup;
		animations.truck = { sirenLight: sirenLight };

		// Setup animation state
		animations.rubble = { baseY: rubbleGroup.position.y };
		animations.dust = { baseY: dustGroup.position.y };
		animations.time = 0;
		animations.explosionFlash = 0;

		// Setup key listener for HUD toggle
		document.addEventListener('keydown', handleKeyDown);

		return { init: init, update: update, reset: reset };
	}

	function createFigure(color) {
		var group = new THREE.Group();

		var body = new THREE.Mesh(
			new THREE.BoxGeometry(1, 3, 0.8),
			new THREE.MeshStandardMaterial({ color: color })
		);
		body.position.y = 1.5;
		body.castShadow = true;
		group.add(body);

		var head = new THREE.Mesh(
			new THREE.BoxGeometry(0.8, 0.8, 0.8),
			new THREE.MeshStandardMaterial({ color: 0xFFBB99 })
		);
		head.position.y = 3.3;
		head.castShadow = true;
		group.add(head);

		return group;
	}

	function createCar() {
		var group = new THREE.Group();

		var body = new THREE.Mesh(
			new THREE.BoxGeometry(8, 3, 15),
			new THREE.MeshStandardMaterial({ color: 0x333333 })
		);
		body.position.y = 1.5;
		body.castShadow = true;
		group.add(body);

		var cabin = new THREE.Mesh(
			new THREE.BoxGeometry(6, 2.5, 6),
			new THREE.MeshStandardMaterial({ color: 0x222222 })
		);
		cabin.position.set(0, 3.5, -2);
		cabin.castShadow = true;
		group.add(cabin);

		return group;
	}

	function createHUD() {
		hudElement = document.createElement('div');
		hudElement.style.position = 'absolute';
		hudElement.style.top = '20px';
		hudElement.style.left = '20px';
		hudElement.style.color = '#00FF00';
		hudElement.style.fontFamily = 'monospace';
		hudElement.style.fontSize = '16px';
		hudElement.style.backgroundColor = 'rgba(0,0,0,0.6)';
		hudElement.style.padding = '10px';
		hudElement.style.border = '2px solid #00FF00';
		hudElement.style.zIndex = '100';
		hudElement.innerHTML = 'AFTERSHOCK: IMMINENT<br/>SURVIVORS FOUND: 0/4<br/>LOOTERS: 4<br/><br/><span style="font-size: 12px;">Press H+E to toggle</span>';
		document.body.appendChild(hudElement);
	}

	function handleKeyDown(event) {
		keyBuffer.push(event.key.toUpperCase());
		var now = Date.now();

		if (keyBuffer.length > 2) {
			keyBuffer.shift();
		}

		if (now - lastKeyTime > 400) {
			keyBuffer = [event.key.toUpperCase()];
		}

		if (keyBuffer.length === 2 && keyBuffer[0] === 'H' && keyBuffer[1] === 'E') {
			toggleHUD();
			keyBuffer = [];
		}

		lastKeyTime = now;
	}

	function toggleHUD() {
		if (hudElement.style.display === 'none') {
			hudElement.style.display = 'block';
		} else {
			hudElement.style.display = 'none';
		}
	}

	function update(delta) {
		time += delta;
		animations.time += delta;

		// Rubble shake on aftershock timer
		if (Math.floor(animations.time * 2) % 10 === 0) {
			sceneObjects.rubble.position.y = animations.rubble.baseY + Math.sin(time * 20) * 0.3;
		} else {
			sceneObjects.rubble.position.y = animations.rubble.baseY;
		}

		// Gas explosion flicker and pulse
		animations.explosionFlash = Math.max(0, animations.explosionFlash - delta * 2);
		var explosionIntensity = 0.3 + Math.sin(time * 4) * 0.2 + animations.explosionFlash * 0.5;
		if (sceneObjects.explosion.children[0]) {
			sceneObjects.explosion.children[0].material.emissive.setHex(0xFF6600);
			sceneObjects.explosion.children[0].material.emissiveIntensity = explosionIntensity;
		}

		// Helicopter orbit and rotor spin
		var helicopterAngle = time * 0.3;
		sceneObjects.helicopter.position.x = Math.cos(helicopterAngle) * 100;
		sceneObjects.helicopter.position.z = Math.sin(helicopterAngle) * 100;
		if (sceneObjects.helicopter.children[1]) {
			sceneObjects.helicopter.children[1].rotation.y = time * 20;
		}

		// Dust column rise and sway
		sceneObjects.dust.position.y = animations.dust.baseY + Math.sin(time * 0.5) * 3;
		sceneObjects.dust.rotation.y = Math.sin(time * 0.3) * 0.1;

		// Truck siren light pulse
		if (animations.truck.sirenLight) {
			var sirenIntensity = 0.5 + Math.sin(time * 6) * 0.5;
			animations.truck.sirenLight.material.emissiveIntensity = sirenIntensity;
		}

		// Looter movement (fleeing)
		var looterCount = sceneObjects.looters.children.length;
		for (var i = 0; i < looterCount; i++) {
			var looter = sceneObjects.looters.children[i];
			looter.position.x += Math.sin(time + i) * 0.05;
			looter.position.z += Math.cos(time + i) * 0.05;
			looter.rotation.y = Math.atan2(
				Math.cos(time + i) * 0.05,
				Math.sin(time + i) * 0.05
			);
		}

		// USAR team search animation
		var usarCount = sceneObjects.usar.children.length;
		for (var i = 0; i < usarCount; i++) {
			var usar = sceneObjects.usar.children[i];
			usar.position.y = 0.5 + Math.sin(time * 2 + i) * 0.3;
		}

		// Water spray wave
		var waterSpray1 = sceneObjects.hydrant1.children[1];
		if (waterSpray1) {
			waterSpray1.position.y = 4 + Math.sin(time * 3) * 0.5;
		}
		var waterSpray2 = sceneObjects.hydrant2.children[1];
		if (waterSpray2) {
			waterSpray2.position.y = 4 + Math.sin(time * 3 + Math.PI) * 0.5;
		}
	}

	function reset() {
		time = 0;
		survivors = 0;
		lootersCount = 4;
		keyBuffer = [];
		if (hudElement) {
			hudElement.innerHTML = 'AFTERSHOCK: IMMINENT<br/>SURVIVORS FOUND: 0/4<br/>LOOTERS: 4<br/><br/><span style="font-size: 12px;">Press H+E to toggle</span>';
			hudElement.style.display = 'block';
		}
		// Reset positions
		if (sceneObjects.rubble) sceneObjects.rubble.position.y = animations.rubble.baseY;
		if (sceneObjects.dust) sceneObjects.dust.position.y = animations.dust.baseY;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
