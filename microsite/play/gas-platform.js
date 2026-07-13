window.GasPlatform = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var sceneObjects = [];
	var isInitialized = false;
	var isVisible = true;
	var keyBindingState = { firstKeyTime: null, firstKeyCode: null };
	var hudElement = null;
	var animationTime = 0;

	var state = {
		gasFlow: 847,
		sabotagePoints: 0,
		platformSecured: false,
		craneRotation: 0,
		flareScale: 1.0,
		flareEmissive: 0.5,
		beaconBlink: 0,
		boatRock: 0,
		mastBlink: 0
	};

	function createMaterial(color, emissive, emissiveIntensity) {
		emissive = emissive || 0;
		emissiveIntensity = emissiveIntensity || 0;
		return new THREE.MeshPhongMaterial({
			color: color,
			emissive: emissive,
			emissiveIntensity: emissiveIntensity,
			shininess: 100
		});
	}

	function addAndTrack(obj) {
		scene.add(obj);
		sceneObjects.push(obj);
		return obj;
	}

	function createMainPlatformDeck() {
		var geometry = new THREE.BoxGeometry(80, 3, 60);
		var material = createMaterial(0x4a4a4a);
		var deck = addAndTrack(new THREE.Mesh(geometry, material));
		deck.position.y = 15;
		deck.position.z = 0;
		return deck;
	}

	function createSupportLeg(x, z) {
		var geometry = new THREE.CylinderGeometry(2, 2.5, 35, 8);
		var material = createMaterial(0x5a5a5a);
		var leg = addAndTrack(new THREE.Mesh(geometry, material));
		leg.position.set(x, -2.5, z);
		return leg;
	}

	function createSupportLegs() {
		createSupportLeg(-30, -20);
		createSupportLeg(30, -20);
		createSupportLeg(-30, 20);
		createSupportLeg(30, 20);
	}

	function createGasFlare() {
		var flareGroup = new THREE.Group();

		var towerGeo = new THREE.CylinderGeometry(1.5, 1.5, 30, 12);
		var towerMat = createMaterial(0x3a3a3a);
		var tower = new THREE.Mesh(towerGeo, towerMat);
		tower.position.y = 15;
		flareGroup.add(tower);

		var flameGeo = new THREE.ConeGeometry(1.2, 5, 12);
		var flameMat = createMaterial(0xff8800, 0xff6600, 1.0);
		var flame = new THREE.Mesh(flameGeo, flameMat);
		flame.position.y = 20.5;
		flame.userData.isFlame = true;
		flareGroup.add(flame);

		var flare = addAndTrack(flareGroup);
		flare.position.set(0, 0, 25);
		return flare;
	}

	function createHelipad() {
		var padGeo = new THREE.BoxGeometry(20, 0.5, 20);
		var padMat = createMaterial(0x666666);
		var pad = addAndTrack(new THREE.Mesh(padGeo, padMat));
		pad.position.set(-25, 18.5, -25);

		var lineGroup = new THREE.Group();
		var material = new THREE.LineBasicMaterial({ color: 0xff0000 });

		var points = [
			new THREE.Vector3(-9, 0, -9),
			new THREE.Vector3(9, 0, -9),
			new THREE.Vector3(9, 0, 9),
			new THREE.Vector3(-9, 0, 9),
			new THREE.Vector3(-9, 0, -9)
		];
		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var lines = new THREE.LineSegments(geometry, material);
		lineGroup.add(lines);

		var hText = new THREE.Group();
		var h1Pts = [new THREE.Vector3(-2, 0.2, 0), new THREE.Vector3(-2, 0.2, 2)];
		var h1Geo = new THREE.BufferGeometry().setFromPoints(h1Pts);
		hText.add(new THREE.LineSegments(h1Geo, material));
		var h2Pts = [new THREE.Vector3(-2, 0.2, 1), new THREE.Vector3(0, 0.2, 1)];
		var h2Geo = new THREE.BufferGeometry().setFromPoints(h2Pts);
		hText.add(new THREE.LineSegments(h2Geo, material));
		var h3Pts = [new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0, 0.2, 2)];
		var h3Geo = new THREE.BufferGeometry().setFromPoints(h3Pts);
		hText.add(new THREE.LineSegments(h3Geo, material));

		lineGroup.add(hText);
		lineGroup.position.set(-25, 19, -25);
		addAndTrack(lineGroup);
	}

	function createWellheadChristmasTree() {
		var treeGroup = new THREE.Group();

		var basePipeGeo = new THREE.CylinderGeometry(1, 1, 8, 8);
		var pipeMat = createMaterial(0x6b8e23);
		var basePipe = new THREE.Mesh(basePipeGeo, pipeMat);
		basePipe.position.y = 4;
		treeGroup.add(basePipe);

		var valve1Geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
		var valveMat = createMaterial(0x8b0000);
		var valve1 = new THREE.Mesh(valve1Geo, valveMat);
		valve1.position.set(2, 6, 0);
		treeGroup.add(valve1);

		var valve2 = new THREE.Mesh(valve1Geo, valveMat);
		valve2.position.set(-2, 6, 0);
		treeGroup.add(valve2);

		var valve3 = new THREE.Mesh(valve1Geo, valveMat);
		valve3.position.set(0, 8, 0);
		treeGroup.add(valve3);

		var sensorGeo = new THREE.SphereGeometry(0.4, 8, 8);
		var sensorMat = createMaterial(0xffd700);
		var sensor = new THREE.Mesh(sensorGeo, sensorMat);
		sensor.position.set(0, 10, 0);
		treeGroup.add(sensor);

		var tree = addAndTrack(treeGroup);
		tree.position.set(20, 15, 0);
		return tree;
	}

	function createGasProcessingModule() {
		var moduleGeo = new THREE.BoxGeometry(25, 12, 15);
		var moduleMat = createMaterial(0x696969);
		var module = addAndTrack(new THREE.Mesh(moduleGeo, moduleMat));
		module.position.set(35, 21, 15);

		var pipeGroup = new THREE.Group();
		var pipeMat = createMaterial(0x4a4a4a);

		var pipe1Geo = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
		var pipe1 = new THREE.Mesh(pipe1Geo, pipeMat);
		pipe1.rotation.z = Math.PI / 2;
		pipe1.position.set(10, 2, 0);
		pipeGroup.add(pipe1);

		var pipe2Geo = new THREE.CylinderGeometry(0.4, 0.4, 15, 8);
		var pipe2 = new THREE.Mesh(pipe2Geo, pipeMat);
		pipe2.rotation.x = Math.PI / 2;
		pipe2.position.set(0, 5, -8);
		pipeGroup.add(pipe2);

		pipeGroup.position.set(35, 21, 15);
		addAndTrack(pipeGroup);
	}

	function createCraneBoom() {
		var boomGeo = new THREE.BoxGeometry(3, 2, 30);
		var boomMat = createMaterial(0xffaa00);
		var boom = addAndTrack(new THREE.Mesh(boomGeo, boomMat));
		boom.position.set(-35, 28, 5);
		boom.rotation.z = 0.3;
		boom.userData.isCraneBoom = true;
		return boom;
	}

	function createLifeboatStation() {
		var stationGeo = new THREE.BoxGeometry(8, 6, 5);
		var stationMat = createMaterial(0x8b4513);
		var station = addAndTrack(new THREE.Mesh(stationGeo, stationMat));
		station.position.set(-35, 16, -28);

		var boatGeo = new THREE.CylinderGeometry(1.5, 1.8, 8, 12);
		var boatMat = createMaterial(0xff6347);
		var boat = addAndTrack(new THREE.Mesh(boatGeo, boatMat));
		boat.position.set(-35, 20, -32);
		boat.userData.isBoat = true;
		return boat;
	}

	function createEmergencyShutdownPanel() {
		var panelGeo = new THREE.BoxGeometry(3, 4, 1);
		var panelMat = createMaterial(0x1a1a1a);
		var panel = addAndTrack(new THREE.Mesh(panelGeo, panelMat));
		panel.position.set(0, 22, 29);

		var ledGroup = new THREE.Group();
		var ledMat1 = createMaterial(0xff0000, 0xff0000, 0.8);
		var led1Geo = new THREE.SphereGeometry(0.25, 8, 8);
		var led1 = new THREE.Mesh(led1Geo, ledMat1);
		led1.position.set(-0.7, 1, 0.6);
		ledGroup.add(led1);

		var ledMat2 = createMaterial(0xffff00, 0xffff00, 0.6);
		var led2 = new THREE.Mesh(led1Geo, ledMat2);
		led2.position.set(0.7, 1, 0.6);
		ledGroup.add(led2);

		var ledMat3 = createMaterial(0xff4500, 0xff4500, 0.7);
		var led3 = new THREE.Mesh(led1Geo, ledMat3);
		led3.position.set(0, -1, 0.6);
		ledGroup.add(led3);

		ledGroup.position.set(0, 22, 29);
		addAndTrack(ledGroup);
	}

	function createPerimeterRailing() {
		var railingGroup = new THREE.Group();
		var lineMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });

		var perimeter = [
			[[-40, 19], [40, 19]],
			[[40, 19], [40, -31]],
			[[40, -31], [-40, -31]],
			[[-40, -31], [-40, 19]]
		];

		perimeter.forEach(function(segment) {
			var pts = [
				new THREE.Vector3(segment[0][0], 19, segment[0][1]),
				new THREE.Vector3(segment[1][0], 19, segment[1][1])
			];
			var geo = new THREE.BufferGeometry().setFromPoints(pts);
			var line = new THREE.LineSegments(geo, lineMat);
			railingGroup.add(line);
		});

		var railing = addAndTrack(railingGroup);
		railing.position.y = 0;
	}

	function createPipeBridge() {
		var bridgeGeo = new THREE.BoxGeometry(4, 2, 25);
		var bridgeMat = createMaterial(0x708090);
		var bridge = addAndTrack(new THREE.Mesh(bridgeGeo, bridgeMat));
		bridge.position.set(55, 22, 0);
		return bridge;
	}

	function createSecondaryPlatform() {
		var platGeo = new THREE.BoxGeometry(30, 2, 25);
		var platMat = createMaterial(0x5a5a5a);
		var plat = addAndTrack(new THREE.Mesh(platGeo, platMat));
		plat.position.set(75, 22, 0);
		return plat;
	}

	function createAccommodationModule() {
		var accomGeo = new THREE.BoxGeometry(20, 10, 15);
		var accomMat = createMaterial(0x2f4f4f);
		var accom = addAndTrack(new THREE.Mesh(accomGeo, accomMat));
		accom.position.set(75, 27, 15);
		return accom;
	}

	function createSupplyBoat() {
		var boatGeo = new THREE.BoxGeometry(12, 4, 8);
		var boatMat = createMaterial(0x1e90ff);
		var boat = addAndTrack(new THREE.Mesh(boatGeo, boatMat));
		boat.position.set(-50, 5, -40);
		boat.userData.isSupplyBoat = true;
		return boat;
	}

	function createRadioMast() {
		var mastGeo = new THREE.CylinderGeometry(0.3, 0.4, 35, 8);
		var mastMat = createMaterial(0x333333);
		var mast = addAndTrack(new THREE.Mesh(mastGeo, mastMat));
		mast.position.set(60, 35, -20);

		var staysGroup = new THREE.Group();
		var stayMat = new THREE.LineBasicMaterial({ color: 0x888888 });

		var stays = [
			[[5, 32], [10, 25]],
			[[-5, 32], [-10, 25]],
			[[0, 32], [8, 20]]
		];

		stays.forEach(function(stay) {
			var pts = [
				new THREE.Vector3(stay[0][0], stay[0][1], 0),
				new THREE.Vector3(stay[1][0], stay[1][1], 5)
			];
			var geo = new THREE.BufferGeometry().setFromPoints(pts);
			var line = new THREE.LineSegments(geo, stayMat);
			staysGroup.add(line);
		});

		staysGroup.position.set(60, 0, -20);
		addAndTrack(staysGroup);

		var lightGeo = new THREE.SphereGeometry(0.5, 8, 8);
		var lightMat = createMaterial(0xff0000, 0xff0000, 0.5);
		var light = new THREE.Mesh(lightGeo, lightMat);
		light.position.set(60, 35.5, -20);
		light.userData.isBeacon = true;
		addAndTrack(light);
	}

	function createOceanWater() {
		var waterGeo = new THREE.BoxGeometry(200, 1, 150);
		var waterMat = createMaterial(0x1a3a52);
		var water = addAndTrack(new THREE.Mesh(waterGeo, waterMat));
		water.position.y = -50;
		return water;
	}

	function createHUD() {
		if (!hudElement) {
			hudElement = document.createElement('div');
			hudElement.id = 'gas-platform-hud';
			hudElement.style.position = 'fixed';
			hudElement.style.top = '10px';
			hudElement.style.left = '10px';
			hudElement.style.color = '#00ff00';
			hudElement.style.fontFamily = 'monospace';
			hudElement.style.fontSize = '14px';
			hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
			hudElement.style.padding = '10px';
			hudElement.style.border = '2px solid #00ff00';
			hudElement.style.zIndex = '9999';
			hudElement.style.display = isVisible ? 'block' : 'none';
			document.body.appendChild(hudElement);
		}
		updateHUD();
	}

	function updateHUD() {
		if (hudElement) {
			var secured = state.platformSecured ? 'YES' : 'NO';
			hudElement.innerHTML = 'GAS FLOW: ' + state.gasFlow + ' MSCFD<br>' +
				'SABOTAGE POINTS: ' + state.sabotagePoints + '/3<br>' +
				'PLATFORM SECURED: ' + secured + '<br>' +
				'<small style="color: #888;">Press G+P to toggle HUD</small>';
		}
	}

	function handleKeyBinding(event) {
		if (event.keyCode === 71 || event.keyCode === 103) {
			if (keyBindingState.firstKeyCode !== 71 && keyBindingState.firstKeyCode !== 103) {
				keyBindingState.firstKeyCode = event.keyCode;
				keyBindingState.firstKeyTime = Date.now();
			}
		} else if (event.keyCode === 80 || event.keyCode === 112) {
			if (keyBindingState.firstKeyCode === 71 || keyBindingState.firstKeyCode === 103) {
				var timeDiff = Date.now() - keyBindingState.firstKeyTime;
				if (timeDiff <= 400) {
					isVisible = !isVisible;
					if (hudElement) {
						hudElement.style.display = isVisible ? 'block' : 'none';
					}
					keyBindingState.firstKeyCode = null;
					keyBindingState.firstKeyTime = null;
				}
			}
		}
	}

	function updateAnimations(delta) {
		animationTime += delta;

		sceneObjects.forEach(function(obj) {
			if (obj.userData.isCraneBoom) {
				obj.rotation.y = Math.sin(animationTime * 0.5) * 0.8;
			}
			if (obj.children) {
				obj.children.forEach(function(child) {
					if (child.userData.isFlame) {
						var scaleAmount = 0.8 + Math.sin(animationTime * 3) * 0.3;
						child.scale.y = scaleAmount;
						child.material.emissiveIntensity = 0.5 + Math.sin(animationTime * 2.5) * 0.5;
					}
					if (child.userData.isBeacon) {
						var blink = Math.sin(animationTime * 4) > 0 ? 1.0 : 0.1;
						child.material.emissiveIntensity = blink;
					}
				});
			}
			if (obj.userData.isSupplyBoat) {
				obj.position.y = 5 + Math.sin(animationTime * 1.2) * 0.5;
				obj.rotation.z = Math.sin(animationTime * 0.8) * 0.1;
			}
			if (obj.userData.isBoat) {
				obj.position.y = 20 + Math.sin(animationTime * 1.1) * 0.4;
			}
		});

		var beacons = scene.getObjectByName('beaconGroup');
		if (beacons) {
			beacons.children.forEach(function(beacon) {
				if (beacon.userData && beacon.userData.isBeacon) {
					var blink = Math.sin(animationTime * 3) > 0 ? 1.0 : 0.2;
					beacon.material.emissiveIntensity = blink;
				}
			});
		}
	}

	return {
		init: function(sceneRef, cameraRef) {
			if (isInitialized) return;

			scene = sceneRef;
			camera = cameraRef;

			createMainPlatformDeck();
			createSupportLegs();
			createGasFlare();
			createHelipad();
			createWellheadChristmasTree();
			createGasProcessingModule();
			createCraneBoom();
			createLifeboatStation();
			createEmergencyShutdownPanel();
			createPerimeterRailing();
			createPipeBridge();
			createSecondaryPlatform();
			createAccommodationModule();
			createSupplyBoat();
			createRadioMast();
			createOceanWater();

			createHUD();

			document.addEventListener('keydown', handleKeyBinding);

			isInitialized = true;
		},

		update: function(delta) {
			if (!isInitialized) return;
			updateAnimations(delta);
		},

		reset: function() {
			sceneObjects.forEach(function(obj) {
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
			});

			sceneObjects.forEach(function(obj) {
				scene.remove(obj);
			});

			sceneObjects = [];

			if (hudElement && hudElement.parentNode) {
				hudElement.parentNode.removeChild(hudElement);
				hudElement = null;
			}

			document.removeEventListener('keydown', handleKeyBinding);

			keyBindingState = { firstKeyTime: null, firstKeyCode: null };
			animationTime = 0;
			isInitialized = false;
			isVisible = true;

			state = {
				gasFlow: 847,
				sabotagePoints: 0,
				platformSecured: false,
				craneRotation: 0,
				flareScale: 1.0,
				flareEmissive: 0.5,
				beaconBlink: 0,
				boatRock: 0,
				mastBlink: 0
			};
		}
	};
}());
