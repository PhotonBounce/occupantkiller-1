window.BattleshipDeck = (function() {
	'use strict';

	var scene, camera, objects = {};
	var gameState = {
		shipSpeed: 28,
		torpedoDamage: 15,
		boardingParty: 3,
		gunRotation: 0,
		aaGunRotation: [0, 0, 0, 0],
		radarRotation: 0,
		aircraftSlide: 0,
		boardingPartyY: 40,
		shipRockAmount: 0,
		lastHKeyTime: 0,
		dKeyPressed: false
	};

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		// 1. Ocean below — large dark blue box (500×3×500)
		var oceanGeo = new THREE.BoxGeometry(500, 3, 500);
		var oceanMat = new THREE.MeshStandardMaterial({ color: 0x0a1a2e });
		var ocean = new THREE.Mesh(oceanGeo, oceanMat);
		ocean.position.y = -1.5;
		scene.add(ocean);
		objects.ocean = ocean;

		// 2. Main deck — long gray flat box (200×1×40)
		var deckGeo = new THREE.BoxGeometry(200, 1, 40);
		var deckMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
		var mainDeck = new THREE.Mesh(deckGeo, deckMat);
		mainDeck.position.y = 2;
		scene.add(mainDeck);
		objects.mainDeck = mainDeck;

		// 3. Superstructure island — tall box complex (20×25×15) on starboard side
		var islandGeo = new THREE.BoxGeometry(20, 25, 15);
		var islandMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
		var island = new THREE.Mesh(islandGeo, islandMat);
		island.position.set(60, 14.5, 0);
		scene.add(island);
		objects.island = island;

		// 4. 2 main gun turrets — large boxy turret housings + twin barrel cylinders
		objects.gunTurrets = [];
		for (var i = 0; i < 2; i++) {
			var turretGroup = new THREE.Group();
			var turretHousings = new THREE.Group();

			var housingGeo = new THREE.BoxGeometry(15, 8, 12);
			var housingMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
			var housing = new THREE.Mesh(housingGeo, housingMat);
			housing.position.y = 4;
			turretHousings.add(housing);

			var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 16, 8);
			var barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
			var barrel1 = new THREE.Mesh(barrelGeo, barrelMat);
			var barrel2 = new THREE.Mesh(barrelGeo, barrelMat);
			barrel1.rotation.z = Math.PI / 2;
			barrel2.rotation.z = Math.PI / 2;
			barrel1.position.set(-2.5, 9, 0);
			barrel2.position.set(2.5, 9, 0);
			turretHousings.add(barrel1);
			turretHousings.add(barrel2);

			turretGroup.add(turretHousings);
			turretGroup.position.set(-50 + i * 100, 8, -15);
			scene.add(turretGroup);
			objects.gunTurrets.push(turretGroup);
		}

		// 5. 4 secondary AA gun positions — small swivel gun box + mount box
		objects.aaGuns = [];
		var aaPositions = [
			{ x: -60, z: 15 },
			{ x: 60, z: 15 },
			{ x: -60, z: -15 },
			{ x: 60, z: -15 }
		];
		for (var i = 0; i < 4; i++) {
			var aaGroup = new THREE.Group();
			var mountGeo = new THREE.BoxGeometry(4, 6, 4);
			var mountMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var mount = new THREE.Mesh(mountGeo, mountMat);
			mount.position.y = 3;
			aaGroup.add(mount);

			var gunGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
			var gunMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
			var gun = new THREE.Mesh(gunGeo, gunMat);
			gun.rotation.z = Math.PI / 2.5;
			gun.position.set(0, 7, 0);
			aaGroup.add(gun);

			aaGroup.position.set(aaPositions[i].x, 8, aaPositions[i].z);
			scene.add(aaGroup);
			objects.aaGuns.push(aaGroup);
		}

		// 6. Flight deck extension — flat box (60×0.5×40) at stern
		var flightDeckGeo = new THREE.BoxGeometry(60, 0.5, 40);
		var flightDeckMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6 });
		var flightDeck = new THREE.Mesh(flightDeckGeo, flightDeckMat);
		flightDeck.position.set(-80, 2.25, 0);
		scene.add(flightDeck);
		objects.flightDeck = flightDeck;

		// 7. 2 aircraft on deck — flat box fuselage + delta wings + cockpit dome
		objects.aircraft = [];
		for (var i = 0; i < 2; i++) {
			var aircraftGroup = new THREE.Group();

			var fuselageGeo = new THREE.BoxGeometry(2, 1, 12);
			var fuselageMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
			var fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
			aircraftGroup.add(fuselage);

			var wingGeo = new THREE.BoxGeometry(18, 0.2, 4);
			var wingMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
			var wing = new THREE.Mesh(wingGeo, wingMat);
			aircraftGroup.add(wing);

			var cockpitGeo = new THREE.SphereGeometry(0.6, 8, 8);
			var cockpitMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
			var cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
			cockpit.position.y = 0.8;
			aircraftGroup.add(cockpit);

			aircraftGroup.position.set(-80 + i * 20, 3, 10);
			scene.add(aircraftGroup);
			objects.aircraft.push(aircraftGroup);
		}

		// 8. 4 naval crew figures — white/blue navy uniform boxes, damage control
		objects.crewFigures = [];
		var crewPositions = [
			{ x: -20, z: -8 },
			{ x: 10, z: 8 },
			{ x: 30, z: -5 },
			{ x: -40, z: 12 }
		];
		for (var i = 0; i < 4; i++) {
			var crewGroup = new THREE.Group();

			var bodyGeo = new THREE.BoxGeometry(1.2, 1.8, 0.6);
			var bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
			var body = new THREE.Mesh(bodyGeo, bodyMat);
			body.position.y = 0.9;
			crewGroup.add(body);

			var headGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
			var headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
			var head = new THREE.Mesh(headGeo, headMat);
			head.position.y = 2;
			crewGroup.add(head);

			crewGroup.position.set(crewPositions[i].x, 3, crewPositions[i].z);
			scene.add(crewGroup);
			objects.crewFigures.push(crewGroup);
		}

		// 9. 3 enemy boarding party — black wetsuit box figures from helicopter
		objects.boardingParty = [];
		for (var i = 0; i < 3; i++) {
			var enemyGroup = new THREE.Group();

			var bodyGeo = new THREE.BoxGeometry(1, 1.6, 0.5);
			var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
			var body = new THREE.Mesh(bodyGeo, bodyMat);
			body.position.y = 0.8;
			enemyGroup.add(body);

			var headGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
			var headMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d });
			var head = new THREE.Mesh(headGeo, headMat);
			head.position.y = 1.7;
			enemyGroup.add(head);

			enemyGroup.position.set(-30 + i * 25, 40, -20);
			scene.add(enemyGroup);
			objects.boardingParty.push(enemyGroup);
		}

		// 10. Torpedo impact — emissive orange explosion cluster at ship port side + flooding effect
		objects.torpedoImpact = new THREE.Group();
		var explosionGeo = new THREE.BoxGeometry(8, 8, 3);
		var explosionMat = new THREE.MeshStandardMaterial({
			color: 0xff8800,
			emissive: 0xff6600,
			emissiveIntensity: 0.8
		});
		var explosion = new THREE.Mesh(explosionGeo, explosionMat);
		objects.torpedoImpact.add(explosion);

		for (var i = 0; i < 3; i++) {
			var fireBallGeo = new THREE.SphereGeometry(2 + i, 8, 8);
			var fireballMat = new THREE.MeshStandardMaterial({
				color: 0xff6600,
				emissive: 0xff4400,
				emissiveIntensity: 0.6
			});
			var fireball = new THREE.Mesh(fireBallGeo, fireballMat);
			fireball.position.set(-2 + i, 3 - i * 0.5, 0);
			objects.torpedoImpact.add(fireball);
		}

		objects.torpedoImpact.position.set(-95, 4, -18);
		scene.add(objects.torpedoImpact);

		// 11. Radar mast — tall thin pole + rotating dish group
		objects.radarMast = new THREE.Group();
		var mastGeo = new THREE.CylinderGeometry(0.4, 0.4, 30, 8);
		var mastMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
		var mast = new THREE.Mesh(mastGeo, mastMat);
		mast.position.y = 15;
		objects.radarMast.add(mast);

		var radarDish = new THREE.Group();
		var dishGeo = new THREE.CylinderGeometry(3, 3, 0.3, 16);
		var dishMat = new THREE.MeshStandardMaterial({ color: 0xdddd00, emissiveIntensity: 0.3 });
		var dish = new THREE.Mesh(dishGeo, dishMat);
		dish.position.y = 0.5;
		radarDish.add(dish);
		radarDish.position.y = 28;
		objects.radarMast.add(radarDish);

		objects.radarMast.position.set(55, 5, -5);
		scene.add(objects.radarMast);

		// 12. Fire hose team — 2 navy figure boxes holding long thin box hose
		objects.hoseTeam = new THREE.Group();
		for (var i = 0; i < 2; i++) {
			var figureGeo = new THREE.BoxGeometry(1, 1.8, 0.6);
			var figureMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
			var figure = new THREE.Mesh(figureGeo, figureMat);
			figure.position.set(-15 + i * 8, 0.9, 0);
			objects.hoseTeam.add(figure);
		}

		var hoseGeo = new THREE.BoxGeometry(12, 0.3, 0.3);
		var hoseMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
		var hose = new THREE.Mesh(hoseGeo, hoseMat);
		hose.position.set(-5, 1.5, 0);
		objects.hoseTeam.add(hose);

		objects.hoseTeam.position.set(0, 3, 12);
		scene.add(objects.hoseTeam);

		// 13. Anchor chain hawsepipe — chain link boxes descending from bow
		objects.anchorChain = new THREE.Group();
		for (var i = 0; i < 8; i++) {
			var linkGeo = new THREE.BoxGeometry(1, 1.5, 0.8);
			var linkMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
			var link = new THREE.Mesh(linkGeo, linkMat);
			link.position.y = -i * 2;
			objects.anchorChain.add(link);
		}
		objects.anchorChain.position.set(95, 5, -18);
		scene.add(objects.anchorChain);

		// 14. Lifeboats — 2 orange box lifeboats in davit cradles
		objects.lifeboats = [];
		for (var i = 0; i < 2; i++) {
			var boatGroup = new THREE.Group();

			var boatGeo = new THREE.BoxGeometry(8, 3, 3);
			var boatMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
			var boat = new THREE.Mesh(boatGeo, boatMat);
			boatGroup.add(boat);

			var davitGeo = new THREE.BoxGeometry(0.5, 12, 0.5);
			var davitMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
			var davit = new THREE.Mesh(davitGeo, davitMat);
			davit.position.set(0, 6, 0);
			boatGroup.add(davit);

			boatGroup.position.set(70 + i * 20, 8, -15 + i * 8);
			scene.add(boatGroup);
			objects.lifeboats.push(boatGroup);
		}

		// 15. Wake trail — flat white emissive box stretching behind stern
		var wakeGeo = new THREE.BoxGeometry(80, 0.1, 15);
		var wakeMat = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			emissive: 0xaaaaaa,
			emissiveIntensity: 0.4,
			transparent: true,
			opacity: 0.6
		});
		var wake = new THREE.Mesh(wakeGeo, wakeMat);
		wake.position.set(-120, 2.1, 0);
		scene.add(wake);
		objects.wake = wake;

		// 16. Bridge windows — row of lit emissive box windows in superstructure
		objects.bridgeWindows = [];
		for (var i = 0; i < 4; i++) {
			var windowGeo = new THREE.BoxGeometry(3, 2, 0.2);
			var windowMat = new THREE.MeshStandardMaterial({
				color: 0x88ccff,
				emissive: 0x4499ff,
				emissiveIntensity: 0.7
			});
			var window = new THREE.Mesh(windowGeo, windowMat);
			window.position.set(55 + i * 5, 22, 8.5);
			scene.add(window);
			objects.bridgeWindows.push(window);
		}

		// HUD setup
		createHUD();
	}

	function createHUD() {
		var hudDiv = document.getElementById('hud');
		if (!hudDiv) {
			hudDiv = document.createElement('div');
			hudDiv.id = 'hud';
			hudDiv.style.position = 'absolute';
			hudDiv.style.top = '20px';
			hudDiv.style.left = '20px';
			hudDiv.style.fontFamily = 'monospace';
			hudDiv.style.fontSize = '18px';
			hudDiv.style.color = '#00ff00';
			hudDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
			hudDiv.style.padding = '10px';
			hudDiv.style.border = '2px solid #00ff00';
			hudDiv.style.zIndex = '1000';
			document.body.appendChild(hudDiv);
		}

		document.addEventListener('keydown', function(e) {
			if (e.key === 'h' || e.key === 'H') {
				var now = Date.now();
				if (now - gameState.lastHKeyTime < 400) {
					gameState.dKeyPressed = true;
					setTimeout(function() { gameState.dKeyPressed = false; }, 100);
				}
				gameState.lastHKeyTime = now;
			}
		});
	}

	function updateHUD() {
		var hudDiv = document.getElementById('hud');
		if (hudDiv) {
			var damagePercent = Math.floor(gameState.torpedoDamage);
			var text = 'SHIP SPEED: ' + gameState.shipSpeed + ' KNOTS\n' +
					   'TORPEDO DAMAGE: ' + damagePercent + '%\n' +
					   'BOARDING PARTY: ' + gameState.boardingParty;
			hudDiv.textContent = text;

			if (gameState.dKeyPressed) {
				hudDiv.style.borderColor = '#ff0000';
				hudDiv.style.color = '#ff0000';
			} else {
				hudDiv.style.borderColor = '#00ff00';
				hudDiv.style.color = '#00ff00';
			}
		}
	}

	function update(delta) {
		if (!scene) return;

		// Gun turret rotation toward threat
		gameState.gunRotation += delta * 0.5;
		if (objects.gunTurrets) {
			for (var i = 0; i < objects.gunTurrets.length; i++) {
				objects.gunTurrets[i].rotation.y = gameState.gunRotation;
			}
		}

		// AA guns rapid oscillation
		gameState.aaGunRotation = gameState.aaGunRotation || [0, 0, 0, 0];
		for (var i = 0; i < 4; i++) {
			gameState.aaGunRotation[i] += delta * 3;
			if (objects.aaGuns && objects.aaGuns[i]) {
				objects.aaGuns[i].rotation.y = Math.sin(gameState.aaGunRotation[i]) * 0.4;
				objects.aaGuns[i].rotation.x = Math.cos(gameState.aaGunRotation[i] * 0.7) * 0.3;
			}
		}

		// Radar spins
		if (objects.radarMast) {
			gameState.radarRotation = (gameState.radarRotation + delta * 1.5) % (Math.PI * 2);
			var radarDish = objects.radarMast.children[1];
			if (radarDish) {
				radarDish.rotation.y = gameState.radarRotation;
			}
		}

		// Aircraft skid on deck (arrested landing)
		gameState.aircraftSlide += delta * 0.2;
		if (objects.aircraft) {
			for (var i = 0; i < objects.aircraft.length; i++) {
				objects.aircraft[i].position.x -= delta * 2;
				objects.aircraft[i].rotation.z = Math.sin(gameState.aircraftSlide) * 0.1;
			}
		}

		// Boarding party descends from above
		gameState.boardingPartyY -= delta * 8;
		if (gameState.boardingPartyY < 3) {
			gameState.boardingPartyY = 40;
		}
		if (objects.boardingParty) {
			for (var i = 0; i < objects.boardingParty.length; i++) {
				objects.boardingParty[i].position.y = gameState.boardingPartyY;
			}
		}

		// Ship gently rocks (Y oscillation for whole group)
		gameState.shipRockAmount = Math.sin(Date.now() * 0.001) * 0.5;
		if (objects.mainDeck) {
			objects.mainDeck.position.y = 2 + gameState.shipRockAmount;
		}
		if (objects.ocean) {
			objects.ocean.position.y = -1.5 + gameState.shipRockAmount * 0.3;
		}

		updateHUD();
	}

	function reset() {
		gameState.shipSpeed = 28;
		gameState.torpedoDamage = 15;
		gameState.boardingParty = 3;
		gameState.gunRotation = 0;
		gameState.aaGunRotation = [0, 0, 0, 0];
		gameState.radarRotation = 0;
		gameState.aircraftSlide = 0;
		gameState.boardingPartyY = 40;
		gameState.shipRockAmount = 0;
		gameState.lastHKeyTime = 0;
		gameState.dKeyPressed = false;

		if (objects.gunTurrets) {
			for (var i = 0; i < objects.gunTurrets.length; i++) {
				objects.gunTurrets[i].rotation.set(0, 0, 0);
			}
		}

		if (objects.aaGuns) {
			for (var i = 0; i < objects.aaGuns.length; i++) {
				objects.aaGuns[i].rotation.set(0, 0, 0);
			}
		}

		if (objects.radarMast) {
			var radarDish = objects.radarMast.children[1];
			if (radarDish) {
				radarDish.rotation.y = 0;
			}
		}

		if (objects.aircraft) {
			for (var i = 0; i < objects.aircraft.length; i++) {
				objects.aircraft[i].position.x = -80 + i * 20;
				objects.aircraft[i].rotation.z = 0;
			}
		}

		if (objects.boardingParty) {
			for (var i = 0; i < objects.boardingParty.length; i++) {
				objects.boardingParty[i].position.y = 40;
			}
		}

		updateHUD();
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
