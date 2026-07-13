window.ZooBreakout = (function() {
	'use strict';

	var scene, camera, renderer, canvas, context;
	var clock = new THREE.Clock();
	var width = 800, height = 600;

	// State tracking
	var animals = [];
	var visitors = [];
	var guards = [];
	var sceneObjects = [];
	var animalsContained = 0;
	var visitorsEvacuated = 0;
	var hudVisible = false;
	var lastZPress = 0;

	function init(container) {
		// Scene setup
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x87CEEB);
		scene.fog = new THREE.Fog(0x87CEEB, 200, 300);

		// Camera setup
		camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
		camera.position.set(0, 20, 40);
		camera.lookAt(0, 0, 0);

		// Renderer setup
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(width, height);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowShadowMap;
		container.appendChild(renderer.domElement);

		// Lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 50, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 200;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);

		// HUD Canvas
		canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		context = canvas.getContext('2d');

		// Build scene
		buildZooPath();
		buildLionEnclosure();
		buildEscapedLion();
		buildEscapedTiger();
		buildEscapedGorilla();
		buildGiraffeEnclosure();
		buildGiraffe();
		buildVisitors();
		buildSecurityGuards();
		buildTranquilizerGun();
		buildEmergencyVehicle();
		buildAnimalFoodCart();
		buildSouvenirShop();
		buildFountain();
		buildZooGate();
		buildEscapedReptile();
		buildAbandonedStroller();

		// HUD setup
		updateHUD();

		// Keybinding
		document.addEventListener('keydown', handleKeyPress);

		return {
			scene: scene,
			camera: camera,
			renderer: renderer
		};
	}

	function buildZooPath() {
		var geometry = new THREE.BoxGeometry(100, 0.5, 100);
		var material = new THREE.MeshStandardMaterial({ color: 0x999999 });
		var path = new THREE.Mesh(geometry, material);
		path.position.y = -0.25;
		path.receiveShadow = true;
		scene.add(path);
		sceneObjects.push({ mesh: path, geometry: geometry, material: material });
	}

	function buildLionEnclosure() {
		// Broken cage box
		var geometry = new THREE.BoxGeometry(15, 12, 15);
		var material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
		var cage = new THREE.Mesh(geometry, material);
		cage.position.set(-30, 6, -20);
		cage.castShadow = true;
		cage.receiveShadow = true;
		scene.add(cage);
		sceneObjects.push({ mesh: cage, geometry: geometry, material: material });

		// Broken bars (LineSegments)
		var barsGeometry = new THREE.BufferGeometry();
		var positions = [];
		for (var i = 0; i < 4; i++) {
			positions.push(-30 - 7.5, 0, -20 - 7.5 + i * 5);
			positions.push(-30 - 7.5, 12, -20 - 7.5 + i * 5);
		}
		barsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
		var barsMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
		var bars = new THREE.LineSegments(barsGeometry, barsMaterial);
		scene.add(bars);
		sceneObjects.push({ mesh: bars, geometry: barsGeometry, material: barsMaterial });
	}

	function buildEscapedLion() {
		var lion = new THREE.Group();

		// Body
		var bodyGeom = new THREE.BoxGeometry(3, 2, 5);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0xDAA520 });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.y = 1;
		body.castShadow = true;
		lion.add(body);
		sceneObjects.push({ mesh: body, geometry: bodyGeom, material: bodyMat });

		// Head
		var headGeom = new THREE.BoxGeometry(2, 2, 2);
		var headMat = new THREE.MeshStandardMaterial({ color: 0xD4A017 });
		var head = new THREE.Mesh(headGeom, headMat);
		head.position.set(0, 2, 3);
		head.castShadow = true;
		lion.add(head);
		sceneObjects.push({ mesh: head, geometry: headGeom, material: headMat });

		// Legs
		for (var i = 0; i < 4; i++) {
			var legGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
			var legMat = new THREE.MeshStandardMaterial({ color: 0xDAA520 });
			var leg = new THREE.Mesh(legGeom, legMat);
			var xPos = (i < 2) ? -1 : 1;
			var zPos = (i % 2 === 0) ? 1 : -1;
			leg.position.set(xPos, 0.5, zPos);
			leg.castShadow = true;
			lion.add(leg);
			sceneObjects.push({ mesh: leg, geometry: legGeom, material: legMat });
		}

		lion.position.set(0, 0, 0);
		lion.userData.type = 'lion';
		lion.userData.speed = 0.15;
		animals.push(lion);
		scene.add(lion);
	}

	function buildEscapedTiger() {
		var tiger = new THREE.Group();

		// Body
		var bodyGeom = new THREE.BoxGeometry(3.5, 2, 5.5);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF8C00 });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.y = 1;
		body.castShadow = true;
		tiger.add(body);
		sceneObjects.push({ mesh: body, geometry: bodyGeom, material: bodyMat });

		// Head
		var headGeom = new THREE.BoxGeometry(2.2, 2, 2.2);
		var headMat = new THREE.MeshStandardMaterial({ color: 0xFF7F50 });
		var head = new THREE.Mesh(headGeom, headMat);
		head.position.set(0, 2, 3.2);
		head.castShadow = true;
		tiger.add(head);
		sceneObjects.push({ mesh: head, geometry: headGeom, material: headMat });

		tiger.position.set(15, 0, 10);
		tiger.userData.type = 'tiger';
		tiger.userData.speed = 0.12;
		tiger.userData.angle = 0;
		animals.push(tiger);
		scene.add(tiger);
	}

	function buildEscapedGorilla() {
		var gorilla = new THREE.Group();

		// Body
		var bodyGeom = new THREE.BoxGeometry(4, 5, 2.5);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.y = 2.5;
		body.castShadow = true;
		gorilla.add(body);
		sceneObjects.push({ mesh: body, geometry: bodyGeom, material: bodyMat });

		// Head
		var headGeom = new THREE.SphereGeometry(1.5, 8, 8);
		var headMat = new THREE.MeshStandardMaterial({ color: 0x1C1C1C });
		var head = new THREE.Mesh(headGeom, headMat);
		head.position.set(0, 5, 0);
		head.castShadow = true;
		gorilla.add(head);
		sceneObjects.push({ mesh: head, geometry: headGeom, material: headMat });

		gorilla.position.set(-20, 0, 20);
		gorilla.userData.type = 'gorilla';
		gorilla.userData.speed = 0.25;
		gorilla.userData.targetX = 30;
		animals.push(gorilla);
		scene.add(gorilla);
	}

	function buildGiraffeEnclosure() {
		// Fence (LineSegments)
		var fenceGeometry = new THREE.BufferGeometry();
		var positions = [];
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var x = Math.cos(angle) * 20;
			var z = Math.sin(angle) * 20;
			positions.push(x, 0, z);
			positions.push(x, 5, z);
		}
		fenceGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
		var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
		var fence = new THREE.LineSegments(fenceGeometry, fenceMaterial);
		fence.position.set(35, 0, 0);
		scene.add(fence);
		sceneObjects.push({ mesh: fence, geometry: fenceGeometry, material: fenceMaterial });

		// Posts
		for (var i = 0; i < 4; i++) {
			var postGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
			var postMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
			var post = new THREE.Mesh(postGeom, postMat);
			var angle = (i / 4) * Math.PI * 2;
			post.position.set(35 + Math.cos(angle) * 20, 3, Math.sin(angle) * 20);
			post.castShadow = true;
			scene.add(post);
			sceneObjects.push({ mesh: post, geometry: postGeom, material: postMat });
		}
	}

	function buildGiraffe() {
		var giraffe = new THREE.Group();

		// Neck
		var neckGeom = new THREE.CylinderGeometry(0.6, 0.8, 8, 8);
		var neckMat = new THREE.MeshStandardMaterial({ color: 0xF4A460 });
		var neck = new THREE.Mesh(neckGeom, neckMat);
		neck.position.set(0, 6, 0);
		neck.castShadow = true;
		neck.userData.baseRotationZ = 0;
		giraffe.add(neck);
		sceneObjects.push({ mesh: neck, geometry: neckGeom, material: neckMat });

		// Head
		var headGeom = new THREE.BoxGeometry(1, 1.5, 1.5);
		var headMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
		var head = new THREE.Mesh(headGeom, headMat);
		head.position.set(0, 10.5, 0);
		head.castShadow = true;
		giraffe.add(head);
		sceneObjects.push({ mesh: head, geometry: headGeom, material: headMat });

		// Body
		var bodyGeom = new THREE.BoxGeometry(2, 3, 3);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0xF4A460 });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.set(0, 1.5, 0);
		body.castShadow = true;
		giraffe.add(body);
		sceneObjects.push({ mesh: body, geometry: bodyGeom, material: bodyMat });

		giraffe.position.set(35, 0, 0);
		giraffe.userData.neckMesh = neck;
		scene.add(giraffe);
	}

	function buildVisitors() {
		var positions = [
			{ x: -10, z: 10 }, { x: 10, z: 10 }, { x: -15, z: 20 }, { x: 15, z: 20 },
			{ x: -8, z: -10 }, { x: 8, z: -10 }, { x: -20, z: -15 }, { x: 20, z: -15 }
		];

		positions.forEach(function(pos) {
			var visitor = new THREE.Group();

			// Body
			var bodyGeom = new THREE.BoxGeometry(1, 2, 0.8);
			var bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4 });
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.y = 1;
			body.castShadow = true;
			visitor.add(body);
			sceneObjects.push({ mesh: body, geometry: bodyGeom, material: bodyMat });

			// Head
			var headGeom = new THREE.SphereGeometry(0.4, 8, 8);
			var headMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC });
			var head = new THREE.Mesh(headGeom, headMat);
			head.position.set(0, 2.2, 0);
			head.castShadow = true;
			visitor.add(head);
			sceneObjects.push({ mesh: head, geometry: headGeom, material: headMat });

			visitor.position.set(pos.x, 0, pos.z);
			visitor.userData.speed = 0.08;
			visitor.userData.escapeAngle = Math.atan2(pos.z, pos.x);
			visitor.userData.evacuated = false;
			visitors.push(visitor);
			scene.add(visitor);
		});
	}

	function buildSecurityGuards() {
		var positions = [
			{ x: -25, z: 0 }, { x: 25, z: 0 }, { x: 0, z: -25 }, { x: 0, z: 25 }
		];

		positions.forEach(function(pos) {
			var guard = new THREE.Group();

			// Body
			var bodyGeom = new THREE.BoxGeometry(1, 2, 0.8);
			var bodyMat = new THREE.MeshStandardMaterial({ color: 0xD4A574 });
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.y = 1;
			body.castShadow = true;
			guard.add(body);
			sceneObjects.push({ mesh: body, geometry: bodyGeom, material: bodyMat });

			// Head
			var headGeom = new THREE.SphereGeometry(0.4, 8, 8);
			var headMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC });
			var head = new THREE.Mesh(headGeom, headMat);
			head.position.set(0, 2.2, 0);
			head.castShadow = true;
			guard.add(head);
			sceneObjects.push({ mesh: head, geometry: headGeom, material: headMat });

			guard.position.set(pos.x, 0, pos.z);
			guard.userData.type = 'guard';
			guard.userData.speed = 0.1;
			guards.push(guard);
			scene.add(guard);
		});
	}

	function buildTranquilizerGun() {
		var gun = new THREE.Group();

		// Gun body
		var gunGeom = new THREE.BoxGeometry(0.3, 0.3, 1.5);
		var gunMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
		var gunBody = new THREE.Mesh(gunGeom, gunMat);
		gunBody.castShadow = true;
		gun.add(gunBody);
		sceneObjects.push({ mesh: gunBody, geometry: gunGeom, material: gunMat });

		gun.position.set(20, 1.5, -20);
		gun.userData.type = 'gun';
		scene.add(gun);
	}

	function buildEmergencyVehicle() {
		var vehicle = new THREE.Group();

		// Body
		var bodyGeom = new THREE.BoxGeometry(4, 2.5, 8);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF4500 });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.y = 1.25;
		body.castShadow = true;
		vehicle.add(body);
		sceneObjects.push({ mesh: body, geometry: bodyGeom, material: bodyMat });

		// Siren light
		var sirenGeom = new THREE.SphereGeometry(0.4, 8, 8);
		var sirenMat = new THREE.MeshStandardMaterial({
			color: 0xFF0000,
			emissive: 0xFF0000,
			emissiveIntensity: 0.5
		});
		var siren = new THREE.Mesh(sirenGeom, sirenMat);
		siren.position.set(0, 2.8, 0);
		siren.castShadow = true;
		vehicle.add(siren);
		vehicle.userData.sirenMesh = siren;
		sceneObjects.push({ mesh: siren, geometry: sirenGeom, material: sirenMat });

		// Wheels
		for (var i = 0; i < 4; i++) {
			var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 8);
			var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
			var wheel = new THREE.Mesh(wheelGeom, wheelMat);
			var xPos = (i < 2) ? -1.8 : 1.8;
			var zPos = (i % 2 === 0) ? 2 : -2;
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(xPos, 0.6, zPos);
			wheel.castShadow = true;
			vehicle.add(wheel);
			sceneObjects.push({ mesh: wheel, geometry: wheelGeom, material: wheelMat });
		}

		vehicle.position.set(-40, 0, 0);
		vehicle.userData.type = 'vehicle';
		scene.add(vehicle);
	}

	function buildAnimalFoodCart() {
		var cart = new THREE.Group();

		// Cart box
		var cartGeom = new THREE.BoxGeometry(3, 2, 2.5);
		var cartMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
		var cartBox = new THREE.Mesh(cartGeom, cartMat);
		cartBox.position.y = 1;
		cartBox.castShadow = true;
		cart.add(cartBox);
		sceneObjects.push({ mesh: cartBox, geometry: cartGeom, material: cartMat });

		// Containers
		for (var i = 0; i < 3; i++) {
			var containerGeom = new THREE.CylinderGeometry(0.6, 0.6, 1, 8);
			var containerMat = new THREE.MeshStandardMaterial({ color: 0xFF8C00 });
			var container = new THREE.Mesh(containerGeom, containerMat);
			container.position.set(-0.8 + i * 0.8, 2.2, 0);
			container.castShadow = true;
			cart.add(container);
			sceneObjects.push({ mesh: container, geometry: containerGeom, material: containerMat });
		}

		cart.position.set(30, 0, -30);
		scene.add(cart);
	}

	function buildSouvenirShop() {
		var shop = new THREE.Group();

		// Building
		var buildingGeom = new THREE.BoxGeometry(8, 6, 6);
		var buildingMat = new THREE.MeshStandardMaterial({ color: 0xA9A9A9 });
		var building = new THREE.Mesh(buildingGeom, buildingMat);
		building.position.y = 3;
		building.castShadow = true;
		building.receiveShadow = true;
		shop.add(building);
		sceneObjects.push({ mesh: building, geometry: buildingGeom, material: buildingMat });

		// Smashed window
		var windowGeom = new THREE.BoxGeometry(2, 2, 0.1);
		var windowMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
		var window = new THREE.Mesh(windowGeom, windowMat);
		window.position.set(0, 4, 3.05);
		window.castShadow = true;
		shop.add(window);
		sceneObjects.push({ mesh: window, geometry: windowGeom, material: windowMat });

		shop.position.set(-40, 0, 30);
		scene.add(shop);
	}

	function buildFountain() {
		var fountain = new THREE.Group();

		// Base
		var baseGeom = new THREE.CylinderGeometry(5, 5, 1, 16);
		var baseMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.position.y = 0.5;
		base.castShadow = true;
		base.receiveShadow = true;
		fountain.add(base);
		sceneObjects.push({ mesh: base, geometry: baseGeom, material: baseMat });

		// Water
		var waterGeom = new THREE.SphereGeometry(3, 16, 16);
		var waterMat = new THREE.MeshStandardMaterial({
			color: 0x4169E1,
			transparent: true,
			opacity: 0.7
		});
		var water = new THREE.Mesh(waterGeom, waterMat);
		water.position.y = 1.2;
		water.castShadow = true;
		fountain.add(water);
		sceneObjects.push({ mesh: water, geometry: waterGeom, material: waterMat });

		fountain.position.set(40, 0, -40);
		scene.add(fountain);
	}

	function buildZooGate() {
		var gate = new THREE.Group();

		// Left pillar
		var pillarLeftGeom = new THREE.BoxGeometry(1, 6, 1);
		var pillarMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
		var pillarLeft = new THREE.Mesh(pillarLeftGeom, pillarMat);
		pillarLeft.position.set(-5, 3, 0);
		pillarLeft.castShadow = true;
		gate.add(pillarLeft);
		sceneObjects.push({ mesh: pillarLeft, geometry: pillarLeftGeom, material: pillarMat });

		// Right pillar
		var pillarRight = new THREE.Mesh(pillarLeftGeom, pillarMat);
		pillarRight.position.set(5, 3, 0);
		pillarRight.castShadow = true;
		gate.add(pillarRight);

		// Gate bars
		var gateGeometry = new THREE.BufferGeometry();
		var gatePositions = [];
		for (var i = 0; i < 5; i++) {
			gatePositions.push(-5 + i * 2.5, 0, 0);
			gatePositions.push(-5 + i * 2.5, 6, 0);
		}
		gateGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gatePositions), 3));
		var gateMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
		var gateBars = new THREE.LineSegments(gateGeometry, gateMaterial);
		gate.add(gateBars);
		sceneObjects.push({ mesh: gateBars, geometry: gateGeometry, material: gateMaterial });

		gate.position.set(0, 0, -50);
		scene.add(gate);
	}

	function buildEscapedReptile() {
		var reptile = new THREE.Group();

		// Snake body (flat box segments)
		var segments = 6;
		for (var i = 0; i < segments; i++) {
			var segGeom = new THREE.BoxGeometry(1, 0.3, 0.5);
			var segMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
			var segment = new THREE.Mesh(segGeom, segMat);
			segment.position.set(i * 1.2, 0.5, 0);
			segment.castShadow = true;
			reptile.add(segment);
			sceneObjects.push({ mesh: segment, geometry: segGeom, material: segMat });
		}

		reptile.position.set(-15, 0, -30);
		reptile.userData.type = 'reptile';
		reptile.userData.speed = 0.05;
		reptile.userData.angle = Math.PI / 4;
		animals.push(reptile);
		scene.add(reptile);
	}

	function buildAbandonedStroller() {
		var stroller = new THREE.Group();

		// Frame
		var frameGeom = new THREE.BoxGeometry(1.5, 1.5, 2);
		var frameMat = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
		var frame = new THREE.Mesh(frameGeom, frameMat);
		frame.position.y = 0.8;
		frame.castShadow = true;
		frame.receiveShadow = true;
		stroller.add(frame);
		sceneObjects.push({ mesh: frame, geometry: frameGeom, material: frameMat });

		// Wheels
		for (var i = 0; i < 2; i++) {
			var wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
			var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
			var wheel = new THREE.Mesh(wheelGeom, wheelMat);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set((i === 0) ? -0.6 : 0.6, 0.4, 0);
			wheel.castShadow = true;
			stroller.add(wheel);
			sceneObjects.push({ mesh: wheel, geometry: wheelGeom, material: wheelMat });
		}

		stroller.position.set(15, 0, -20);
		scene.add(stroller);
	}

	function updateHUD() {
		context.fillStyle = '#000000';
		context.fillRect(0, 0, 256, 256);

		context.fillStyle = '#FFFFFF';
		context.font = 'bold 16px Arial';
		context.fillText('ANIMALS CONTAINED: ' + animalsContained + '/3', 10, 30);
		context.fillText('VISITORS EVACUATED: ' + visitorsEvacuated + '/8', 10, 60);

		context.fillStyle = '#FF0000';
		context.font = 'bold 20px Arial';
		context.fillText('SITUATION: CRITICAL', 10, 100);
	}

	function handleKeyPress(event) {
		if (event.key === 'z' || event.key === 'Z') {
			var now = Date.now();
			if (now - lastZPress < 400) {
				hudVisible = !hudVisible;
			}
			lastZPress = now;
		}
	}

	function update() {
		var delta = clock.getDelta();

		// Animate Lion - stalks visitors
		if (animals.length > 0) {
			var lion = animals[0];
			if (visitors.length > 0) {
				var visitor = visitors[0];
				var dx = visitor.position.x - lion.position.x;
				var dz = visitor.position.z - lion.position.z;
				var distance = Math.sqrt(dx * dx + dz * dz);
				if (distance > 0.5) {
					var angle = Math.atan2(dz, dx);
					lion.position.x += Math.cos(angle) * lion.userData.speed;
					lion.position.z += Math.sin(angle) * lion.userData.speed;
					lion.rotation.y = angle;
				}
			}
		}

		// Animate Tiger - circles
		if (animals.length > 1) {
			var tiger = animals[1];
			tiger.userData.angle += 0.01;
			tiger.position.x = 15 + Math.cos(tiger.userData.angle) * 12;
			tiger.position.z = 10 + Math.sin(tiger.userData.angle) * 12;
		}

		// Animate Gorilla - charges toward target
		if (animals.length > 2) {
			var gorilla = animals[2];
			if (gorilla.position.x < gorilla.userData.targetX) {
				gorilla.position.x += gorilla.userData.speed;
			}
		}

		// Animate Visitors - scatter outward
		visitors.forEach(function(visitor) {
			if (!visitor.userData.evacuated) {
				var moveX = Math.cos(visitor.userData.escapeAngle) * visitor.userData.speed;
				var moveZ = Math.sin(visitor.userData.escapeAngle) * visitor.userData.speed;
				visitor.position.x += moveX;
				visitor.position.z += moveZ;

				var distFromCenter = Math.sqrt(visitor.position.x * visitor.position.x + visitor.position.z * visitor.position.z);
				if (distFromCenter > 60) {
					visitor.userData.evacuated = true;
					visitorsEvacuated++;
					updateHUD();
				}
			}
		});

		// Animate Guards - pursue animals
		guards.forEach(function(guard) {
			if (animals.length > 0) {
				var target = animals[0];
				var dx = target.position.x - guard.position.x;
				var dz = target.position.z - guard.position.z;
				var distance = Math.sqrt(dx * dx + dz * dz);
				if (distance > 1) {
					var angle = Math.atan2(dz, dx);
					guard.position.x += Math.cos(angle) * guard.userData.speed;
					guard.position.z += Math.sin(angle) * guard.userData.speed;
				}
			}
		});

		// Animate Emergency Vehicle siren
		var vehicles = scene.children.filter(function(obj) {
			return obj.userData && obj.userData.type === 'vehicle';
		});
		vehicles.forEach(function(vehicle) {
			if (vehicle.userData.sirenMesh) {
				var intensity = 0.3 + 0.3 * Math.sin(Date.now() * 0.005);
				vehicle.userData.sirenMesh.material.emissiveIntensity = intensity;
			}
		});

		// Animate Giraffe neck sway
		var giraffes = scene.children.filter(function(obj) {
			return obj.children.some(function(child) {
				return child.userData && child.userData.baseRotationZ !== undefined;
			});
		});
		giraffes.forEach(function(giraffe) {
			giraffe.children.forEach(function(child) {
				if (child.userData && child.userData.baseRotationZ !== undefined) {
					child.rotation.z = Math.sin(Date.now() * 0.002) * 0.1;
				}
			});
		});

		// Animate Reptile
		if (animals.length > 3) {
			var reptile = animals[3];
			reptile.userData.angle += 0.005;
			reptile.position.x += Math.cos(reptile.userData.angle) * reptile.userData.speed;
			reptile.position.z += Math.sin(reptile.userData.angle) * reptile.userData.speed;
		}
	}

	function reset() {
		// Dispose all geometries and materials
		sceneObjects.forEach(function(obj) {
			if (obj.geometry) obj.geometry.dispose();
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					obj.material.forEach(function(m) { m.dispose(); });
				} else {
					obj.material.dispose();
				}
			}
		});

		animals = [];
		visitors = [];
		guards = [];
		sceneObjects = [];
		animalsContained = 0;
		visitorsEvacuated = 0;

		scene.clear();

		if (renderer && renderer.dispose) {
			renderer.dispose();
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
