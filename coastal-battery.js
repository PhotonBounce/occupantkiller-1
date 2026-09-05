window.CoastalBattery = (function() {
	'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

	var scene, camera, renderer, canvas;
	var sceneObjects = [];
	var animations = {
		gunBarrels: [],
		searchlight: null,
		muzzleFlashes: [],
		gunCrew: [],
		landingCraft: null
	};
	var hudVisible = true;
	var keybindState = { lastC: 0, expecting: false };
	var gameState = {
		enemyShipsSunk: 0,
		batteryOperational: true,
		crewCasualties: 0
	};

	function createScene() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x87CEEB);
		scene.fog = new THREE.Fog(0x87CEEB, 1000, 2000);

		// Lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
		scene.add(ambientLight);
		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 200, 100);
		directionalLight.castShadow = true;
		scene.add(directionalLight);

		createTerrain();
		createCliffBase();
		createGunEmplacements();
		createRangeFinderTower();
		createAmmoBunker();
		createShellStorageRacks();
		createSearchlightTower();
		createInfantryTrench();
		createObservationBunker();
		createBarbedWireCoils();
		createGunCrew();
		createFuelOilDrums();
		createCommunicationTrench();
		createFireControlCabin();
		createLandingCraft();
		createMuzzleFlashes();
		createShellCasings();
	}

	function createTerrain() {
		var seaGeometry = new THREE.BoxGeometry(2000, 50, 2000);
		var seaMaterial = new THREE.MeshStandardMaterial({ color: 0x1E90FF });
		var sea = new THREE.Mesh(seaGeometry, seaMaterial);
		sea.position.y = -150;
		sea.receiveShadow = true;
		scene.add(sea);
		sceneObjects.push(sea);

		var groundGeometry = new THREE.BoxGeometry(800, 30, 600);
		var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.y = 0;
		ground.receiveShadow = true;
		scene.add(ground);
		sceneObjects.push(ground);
	}

	function createCliffBase() {
		var cliffGeometry = new THREE.BoxGeometry(600, 120, 200);
		var cliffMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
		var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
		cliff.position.set(-200, 40, -100);
		cliff.castShadow = true;
		cliff.receiveShadow = true;
		scene.add(cliff);
		sceneObjects.push(cliff);
	}

	function createGunEmplacements() {
		// Gun emplacement #1
		var pit1Geometry = new THREE.CylinderGeometry(40, 45, 8, 32);
		var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var pit1 = new THREE.Mesh(pit1Geometry, pitMaterial);
		pit1.position.set(-150, 0, 50);
		pit1.castShadow = true;
		pit1.receiveShadow = true;
		scene.add(pit1);
		sceneObjects.push(pit1);

		var barrel1Geometry = new THREE.BoxGeometry(8, 6, 60);
		var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
		var barrel1 = new THREE.Mesh(barrel1Geometry, barrelMaterial);
		barrel1.position.set(-150, 15, 50);
		barrel1.rotation.z = 0.3;
		barrel1.castShadow = true;
		scene.add(barrel1);
		sceneObjects.push(barrel1);
		animations.gunBarrels.push({ barrel: barrel1, originalRotation: barrel1.rotation.z });

		// Gun emplacement #2
		var pit2Geometry = new THREE.CylinderGeometry(40, 45, 8, 32);
		var pit2 = new THREE.Mesh(pit2Geometry, pitMaterial);
		pit2.position.set(-80, 0, 100);
		pit2.castShadow = true;
		pit2.receiveShadow = true;
		scene.add(pit2);
		sceneObjects.push(pit2);

		var barrel2Geometry = new THREE.BoxGeometry(8, 6, 60);
		var barrel2 = new THREE.Mesh(barrel2Geometry, barrelMaterial);
		barrel2.position.set(-80, 15, 100);
		barrel2.rotation.z = 0.25;
		barrel2.castShadow = true;
		scene.add(barrel2);
		sceneObjects.push(barrel2);
		animations.gunBarrels.push({ barrel: barrel2, originalRotation: barrel2.rotation.z });
	}

	function createRangeFinderTower() {
		var towerGeometry = new THREE.BoxGeometry(12, 80, 12);
		var towerMaterial = new THREE.MeshStandardMaterial({ color: 0xA0A0A0 });
		var tower = new THREE.Mesh(towerGeometry, towerMaterial);
		tower.position.set(100, 40, 80);
		tower.castShadow = true;
		tower.receiveShadow = true;
		scene.add(tower);
		sceneObjects.push(tower);

		var binoGeometry = new THREE.BoxGeometry(20, 8, 20);
		var binoMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
		var binoculars = new THREE.Mesh(binoGeometry, binoMaterial);
		binoculars.position.set(100, 45, 80);
		binoculars.castShadow = true;
		scene.add(binoculars);
		sceneObjects.push(binoculars);
	}

	function createAmmoBunker() {
		var bunkerGeometry = new THREE.BoxGeometry(60, 35, 50);
		var bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
		var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
		bunker.position.set(50, 5, -120);
		bunker.castShadow = true;
		bunker.receiveShadow = true;
		scene.add(bunker);
		sceneObjects.push(bunker);
	}

	function createShellStorageRacks() {
		var rackFrameGeometry = new THREE.BoxGeometry(50, 40, 12);
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var frame = new THREE.Mesh(rackFrameGeometry, frameMaterial);
		frame.position.set(-200, 20, -80);
		frame.castShadow = true;
		frame.receiveShadow = true;
		scene.add(frame);
		sceneObjects.push(frame);

		for (var i = 0; i < 6; i++) {
			var shellGeometry = new THREE.CylinderGeometry(3, 3, 12, 16);
			var shellMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
			var shell = new THREE.Mesh(shellGeometry, shellMaterial);
			shell.position.set(-200 + i * 10, 35, -80);
			shell.castShadow = true;
			scene.add(shell);
			sceneObjects.push(shell);
		}
	}

	function createSearchlightTower() {
		var postGeometry = new THREE.CylinderGeometry(4, 4, 50, 16);
		var postMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
		var post = new THREE.Mesh(postGeometry, postMaterial);
		post.position.set(150, 25, 120);
		post.castShadow = true;
		post.receiveShadow = true;
		scene.add(post);
		sceneObjects.push(post);

		var housingGeometry = new THREE.CylinderGeometry(12, 12, 15, 32);
		var housingMaterial = new THREE.MeshStandardMaterial({
			color: 0xFFFFFF,
			emissive: 0x444444,
			emissiveIntensity: 0.3
		});
		var housing = new THREE.Mesh(housingGeometry, housingMaterial);
		housing.position.set(150, 60, 120);
		housing.castShadow = true;
		scene.add(housing);
		sceneObjects.push(housing);

		var searchlightObj = { post: post, housing: housing, angle: 0 };
		animations.searchlight = searchlightObj;
	}

	function createInfantryTrench() {
		var trenchGeometry = new THREE.BoxGeometry(200, 8, 12);
		var trenchMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
		var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
		trench.position.set(-100, -2, 0);
		trench.castShadow = true;
		trench.receiveShadow = true;
		scene.add(trench);
		sceneObjects.push(trench);
	}

	function createObservationBunker() {
		var bunkerGeometry = new THREE.BoxGeometry(30, 25, 30);
		var bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
		bunker.position.set(120, 5, -60);
		bunker.castShadow = true;
		bunker.receiveShadow = true;
		scene.add(bunker);
		sceneObjects.push(bunker);

		// View slits
		var slitsGeometry = new THREE.BufferGeometry();
		var slitsPositions = new Float32Array([
			-12, 10, 15.1, 12, 10, 15.1,
			-12, 0, 15.1, 12, 0, 15.1,
			-12, 10, -15.1, 12, 10, -15.1
		]);
		slitsGeometry.setAttribute('position', new THREE.BufferAttribute(slitsPositions, 3));
		var slitsMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
		var slits = new THREE.LineSegments(slitsGeometry, slitsMaterial);
		slits.position.copy(bunker.position);
		scene.add(slits);
		sceneObjects.push(slits);
	}

	function createBarbedWireCoils() {
		for (var i = 0; i < 5; i++) {
			var coilGeometry = new THREE.BufferGeometry();
			var coilPoints = [];
			for (var j = 0; j < 32; j++) {
				var angle = (j / 32) * Math.PI * 4;
				var x = Math.cos(angle) * 8;
				var z = Math.sin(angle) * 8;
				coilPoints.push(new THREE.Vector3(x, 0, z));
			}
			coilGeometry.setFromPoints(coilPoints);
			var coilMaterial = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 2 });
			var coil = new THREE.LineSegments(coilGeometry, coilMaterial);
			coil.position.set(-300 + i * 30, 2, 150);
			scene.add(coil);
			sceneObjects.push(coil);
		}
	}

	function createGunCrew() {
		var positions = [
			{ x: -160, z: 45 },
			{ x: -140, z: 45 },
			{ x: -160, z: 55 },
			{ x: -140, z: 55 },
			{ x: -90, z: 95 },
			{ x: -70, z: 95 },
			{ x: -90, z: 105 },
			{ x: -70, z: 105 }
		];

		for (var i = 0; i < positions.length; i++) {
			var bodyGeometry = new THREE.BoxGeometry(3, 8, 3);
			var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
			var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
			body.position.set(positions[i].x, 4, positions[i].z);
			body.castShadow = true;
			scene.add(body);
			sceneObjects.push(body);

			var headGeometry = new THREE.SphereGeometry(2, 8, 8);
			var headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDBAC });
			var head = new THREE.Mesh(headGeometry, headMaterial);
			head.position.set(positions[i].x, 10, positions[i].z);
			head.castShadow = true;
			scene.add(head);
			sceneObjects.push(head);

			animations.gunCrew.push({
				body: body,
				head: head,
				baseY: 4,
				phase: i
			});
		}
	}

	function createFuelOilDrums() {
		for (var i = 0; i < 6; i++) {
			var drumGeometry = new THREE.CylinderGeometry(5, 5, 12, 16);
			var drumMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4500 });
			var drum = new THREE.Mesh(drumGeometry, drumMaterial);
			drum.position.set(30 + i * 15, 6, 40);
			drum.castShadow = true;
			drum.receiveShadow = true;
			scene.add(drum);
			sceneObjects.push(drum);
		}
	}

	function createCommunicationTrench() {
		var angle1 = 0;
		var seg1Geometry = new THREE.BoxGeometry(80, 8, 12);
		var trenchMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
		var seg1 = new THREE.Mesh(seg1Geometry, trenchMaterial);
		seg1.position.set(0, -2, -40);
		seg1.rotation.z = angle1;
		seg1.castShadow = true;
		seg1.receiveShadow = true;
		scene.add(seg1);
		sceneObjects.push(seg1);

		var angle2 = -0.3;
		var seg2Geometry = new THREE.BoxGeometry(80, 8, 12);
		var seg2 = new THREE.Mesh(seg2Geometry, trenchMaterial);
		seg2.position.set(40, -2, -80);
		seg2.rotation.z = angle2;
		seg2.castShadow = true;
		seg2.receiveShadow = true;
		scene.add(seg2);
		sceneObjects.push(seg2);

		var angle3 = 0.3;
		var seg3Geometry = new THREE.BoxGeometry(80, 8, 12);
		var seg3 = new THREE.Mesh(seg3Geometry, trenchMaterial);
		seg3.position.set(80, -2, -120);
		seg3.rotation.z = angle3;
		seg3.castShadow = true;
		seg3.receiveShadow = true;
		scene.add(seg3);
		sceneObjects.push(seg3);
	}

	function createFireControlCabin() {
		var cabinGeometry = new THREE.BoxGeometry(25, 20, 20);
		var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xA0A0A0 });
		var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
		cabin.position.set(-100, 10, 120);
		cabin.castShadow = true;
		cabin.receiveShadow = true;
		scene.add(cabin);
		sceneObjects.push(cabin);

		var antennaGeometry = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
		var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
		var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
		antenna.position.set(-100, 30, 120);
		antenna.castShadow = true;
		scene.add(antenna);
		sceneObjects.push(antenna);
	}

	function createLandingCraft() {
		var hullGeometry = new THREE.BoxGeometry(30, 10, 15);
		var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
		var hull = new THREE.Mesh(hullGeometry, hullMaterial);
		hull.position.set(-400, -100, 300);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);
		sceneObjects.push(hull);

		var superGeometry = new THREE.BoxGeometry(20, 8, 10);
		var superMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var superstructure = new THREE.Mesh(superGeometry, superMaterial);
		superstructure.position.set(-400, -92, 300);
		superstructure.castShadow = true;
		scene.add(superstructure);
		sceneObjects.push(superstructure);

		animations.landingCraft = { hull: hull, superstructure: superstructure };
	}

	function createMuzzleFlashes() {
		var flashPositions = [
			{ x: -150, y: 15, z: 80 },
			{ x: -80, y: 15, z: 130 }
		];

		for (var i = 0; i < flashPositions.length; i++) {
			var flashGeometry = new THREE.SphereGeometry(3, 8, 8);
			var flashMaterial = new THREE.MeshStandardMaterial({
				color: 0xFFFFFF,
				emissive: 0xFFFF00,
				emissiveIntensity: 0
			});
			var flash = new THREE.Mesh(flashGeometry, flashMaterial);
			flash.position.set(flashPositions[i].x, flashPositions[i].y, flashPositions[i].z);
			scene.add(flash);
			sceneObjects.push(flash);
			animations.muzzleFlashes.push({
				flash: flash,
				intensity: 0
			});
		}
	}

	function createShellCasings() {
		for (var i = 0; i < 12; i++) {
			var casingGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
			var casingMaterial = new THREE.MeshStandardMaterial({ color: 0xB8860B });
			var casing = new THREE.Mesh(casingGeometry, casingMaterial);
			var angle = (i / 12) * Math.PI * 2;
			casing.position.set(
				-150 + Math.cos(angle) * 20,
				2,
				50 + Math.sin(angle) * 20
			);
			casing.rotation.z = Math.random() * Math.PI;
			casing.castShadow = true;
			casing.receiveShadow = true;
			scene.add(casing);
			sceneObjects.push(casing);
		}

		for (var j = 0; j < 12; j++) {
			var casing2Geometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
			var casing2Material = new THREE.MeshStandardMaterial({ color: 0xB8860B });
			var casing2 = new THREE.Mesh(casing2Geometry, casing2Material);
			var angle2 = (j / 12) * Math.PI * 2;
			casing2.position.set(
				-80 + Math.cos(angle2) * 20,
				2,
				100 + Math.sin(angle2) * 20
			);
			casing2.rotation.z = Math.random() * Math.PI;
			casing2.castShadow = true;
			casing2.receiveShadow = true;
			scene.add(casing2);
			sceneObjects.push(casing2);
		}
	}

	function createCamera() {
		var width = window.innerWidth || 800;
		var height = window.innerHeight || 600;
		camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 3000);
		camera.position.set(-400, 150, 350);
		camera.lookAt(new THREE.Vector3(-100, 30, 50));
	}

	function createRenderer() {
		canvas = document.createElement('canvas');
		renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
		var width = window.innerWidth || 800;
		var height = window.innerHeight || 600;
		renderer.setSize(width, height);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowShadowMap;
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		document.body.appendChild(canvas);
	}

	function createHUD() {
		var hudCanvas = document.createElement('canvas');
		hudCanvas.id = 'coastal-battery-hud';
		hudCanvas.style.position = 'absolute';
		hudCanvas.style.top = '20px';
		hudCanvas.style.left = '20px';
		hudCanvas.style.fontSize = '18px';
		hudCanvas.style.color = '#00FF00';
		hudCanvas.style.fontFamily = 'monospace';
		hudCanvas.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
		hudCanvas.style.zIndex = '100';
		hudCanvas.style.whiteSpace = 'pre';
		document.body.appendChild(hudCanvas);
		return hudCanvas;
	}

	function updateHUD(hudCanvas) {
		var ctx = hudCanvas.getContext('2d');
		hudCanvas.width = 400;
		hudCanvas.height = 150;
		ctx.fillStyle = '#00FF00';
		ctx.font = 'bold 16px monospace';
		if (hudVisible) {
			ctx.fillText('ENEMY SHIPS SUNK: ' + gameState.enemyShipsSunk + '/3', 10, 30);
			ctx.fillText('BATTERY OPERATIONAL: ' + (gameState.batteryOperational ? 'YES' : 'NO'), 10, 60);
			ctx.fillText('CREW CASUALTIES: ' + gameState.crewCasualties + '/8', 10, 90);
		}
	}

	function handleKeybind() {
		document.addEventListener('keydown', function(event) {
			if (event.key === 'c' || event.key === 'C') {
				var now = Date.now();
				if (keybindState.expecting && now - keybindState.lastC < 400) {
					hudVisible = !hudVisible;
					keybindState.expecting = false;
				} else {
					keybindState.lastC = now;
					keybindState.expecting = true;
					setTimeout(function() {
						keybindState.expecting = false;
					}, 400);
				}
			} else if (event.key === 'b' || event.key === 'B') {
				if (keybindState.expecting) {
					var now = Date.now();
					if (now - keybindState.lastC < 400) {
						hudVisible = !hudVisible;
						keybindState.expecting = false;
					}
				}
			}
		});
	}

	function updateAnimations(time) {
		// Gun barrel elevation/depression
		for (var i = 0; i < animations.gunBarrels.length; i++) {
			var gb = animations.gunBarrels[i];
			var oscillation = Math.sin(time * 0.003) * 0.15;
			gb.barrel.rotation.z = gb.originalRotation + oscillation;
		}

		// Searchlight sweep
		if (animations.searchlight) {
			animations.searchlight.angle += 0.02;
			animations.searchlight.housing.rotation.z = animations.searchlight.angle;
		}

		// Muzzle flash pulse
		for (var j = 0; j < animations.muzzleFlashes.length; j++) {
			var mf = animations.muzzleFlashes[j];
			var flashPulse = Math.max(0, Math.sin(time * 0.008 + j * 2) * 1.5);
			mf.flash.material.emissiveIntensity = flashPulse;
		}

		// Gun crew loading motions
		for (var k = 0; k < animations.gunCrew.length; k++) {
			var crew = animations.gunCrew[k];
			var bobbing = Math.sin(time * 0.004 + crew.phase) * 1.5;
			crew.body.position.y = crew.baseY + bobbing;
			crew.head.position.y = 10 + bobbing;
		}

		// Landing craft advance
		if (animations.landingCraft) {
			var progress = (time * 0.01) % 400;
			animations.landingCraft.hull.position.x = -400 + progress;
			animations.landingCraft.superstructure.position.x = -400 + progress;
		}
	}

	function animate(time) {
		requestAnimationFrame(animate);
		updateAnimations(time);
		var hudCanvas = document.getElementById('coastal-battery-hud');
		if (hudCanvas) {
			updateHUD(hudCanvas);
		}
		if (renderer) renderer.render(scene, camera);
	}

	function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

		if (!window.THREE) {
			console.error('THREE.js not loaded');
			return false;
		}
		createScene();
		createCamera();
		createRenderer();
		var hudCanvas = createHUD();
		handleKeybind();
		animate(0);
		return true;
	}

	function update(deltaTime) {
		// Update logic can be extended
	}

	function reset() {
		// Dispose of geometries and materials
		for (var i = 0; i < sceneObjects.length; i++) {
			var obj = sceneObjects[i];
			if (obj.geometry) {
				obj.geometry.dispose();
			}
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					for (var j = 0; j < obj.material.length; j++) {
						obj.material[j].dispose();
					}
				} else {
					obj.material.dispose();
				}
			}
		}
		sceneObjects = [];
		animations = {
			gunBarrels: [],
			searchlight: null,
			muzzleFlashes: [],
			gunCrew: [],
			landingCraft: null
		};
		if (renderer) {
			renderer.dispose();
		}
		if (canvas && canvas.parentNode) {
			canvas.parentNode.removeChild(canvas);
		}
		var hudCanvas = document.getElementById('coastal-battery-hud');
		if (hudCanvas && hudCanvas.parentNode) {
			hudCanvas.parentNode.removeChild(hudCanvas);
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
