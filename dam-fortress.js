window.DamFortress = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var damGroup = null;
	var reservoirWater = null;
	var spillwayBlocks = [];
	var turbines = [];
	var gates = [];
	var radarDish = null;
	var time = 0;

	function init(inputScene, inputCamera) {
		scene = inputScene;
		camera = inputCamera;
		damGroup = new THREE.Group();
		scene.add(damGroup);

		// Set background to sky blue
		scene.background = new THREE.Color(0x87CEEB);

		// Create dam structures
		createDamWall();
		createReservoir();
		createSpillway();
		createTurbineHall();
		createControlRoom();
		createCatwalks();
		createWaterGates();
		createGunEmplacements();
		createDownstreamRiver();
		createAccessRoad();
		createRadarStation();
		createLighting();
	}

	function createDamWall() {
		var damGeometry = new THREE.BoxGeometry(220, 80, 30);
		var damMaterial = new THREE.MeshStandardMaterial({
			color: 0x808080,
			roughness: 0.8,
			metalness: 0.1
		});
		var damWall = new THREE.Mesh(damGeometry, damMaterial);
		damWall.position.set(0, 0, 0);
		damGroup.add(damWall);

		// Add concrete texture with dark striping
		var stripeGeometry = new THREE.BoxGeometry(220, 3, 31);
		var stripeMaterial = new THREE.MeshStandardMaterial({
			color: 0x505050,
			roughness: 0.9
		});
		for (var i = 0; i < 15; i++) {
			var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
			stripe.position.set(0, -35 + i * 6, 0);
			damGroup.add(stripe);
		}
	}

	function createReservoir() {
		var reservoirGeometry = new THREE.BoxGeometry(240, 2, 300);
		var waterMaterial = new THREE.MeshStandardMaterial({
			color: 0x1E90FF,
			emissive: 0x0055AA,
			roughness: 0.3,
			metalness: 0.4,
			transparent: true,
			opacity: 0.85
		});
		reservoirWater = new THREE.Mesh(reservoirGeometry, waterMaterial);
		reservoirWater.position.set(0, 42, -160);
		damGroup.add(reservoirWater);

		// Reservoir floor
		var floorGeometry = new THREE.BoxGeometry(240, 1, 300);
		var floorMaterial = new THREE.MeshStandardMaterial({
			color: 0x4A4A3A,
			roughness: 0.9
		});
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.set(0, 20, -160);
		damGroup.add(floor);

		// Reservoir walls
		var wallGeometry = new THREE.BoxGeometry(5, 40, 300);
		var wallMaterial = new THREE.MeshStandardMaterial({
			color: 0x606040,
			roughness: 0.8
		});
		var leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
		leftWall.position.set(-120, 30, -160);
		damGroup.add(leftWall);
		var rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
		rightWall.position.set(120, 30, -160);
		damGroup.add(rightWall);
	}

	function createSpillway() {
		var spillwayWidth = 60;
		var spillwayStart = -20;
		var blockHeight = 4;

		for (var row = 0; row < 8; row++) {
			var blockGeometry = new THREE.BoxGeometry(spillwayWidth, blockHeight, 15);
			var blockMaterial = new THREE.MeshStandardMaterial({
				color: 0xA8D8FF,
				roughness: 0.4,
				metalness: 0.1,
				transparent: true,
				opacity: 0.75
			});
			var waterBlock = new THREE.Mesh(blockGeometry, blockMaterial);
			waterBlock.position.set(0, spillwayStart - row * 8, 45);
			waterBlock.originalY = waterBlock.position.y;
			waterBlock.rowIndex = row;
			spillwayBlocks.push(waterBlock);
			damGroup.add(waterBlock);
		}
	}

	function createTurbineHall() {
		// Hall exterior
		var hallGeometry = new THREE.BoxGeometry(80, 50, 40);
		var hallMaterial = new THREE.MeshStandardMaterial({
			color: 0x696969,
			roughness: 0.7
		});
		var hall = new THREE.Mesh(hallGeometry, hallMaterial);
		hall.position.set(-50, -15, 0);
		damGroup.add(hall);

		// Interior turbines
		for (var i = 0; i < 3; i++) {
			var turbineGeometry = new THREE.CylinderGeometry(8, 8, 4, 32);
			var turbineMaterial = new THREE.MeshStandardMaterial({
				color: 0x333333,
				roughness: 0.6,
				metalness: 0.8
			});
			var turbine = new THREE.Mesh(turbineGeometry, turbineMaterial);
			turbine.rotation.z = Math.PI / 2;
			turbine.position.set(-50, -20 + i * 20, 0);
			turbine.originalRotation = { z: Math.PI / 2 };
			turbines.push(turbine);
			damGroup.add(turbine);

			// Turbine blades
			for (var b = 0; b < 3; b++) {
				var bladeGeometry = new THREE.BoxGeometry(2, 16, 3);
				var bladeMaterial = new THREE.MeshStandardMaterial({
					color: 0x1a1a1a,
					metalness: 0.9
				});
				var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
				blade.position.set(-50, -20 + i * 20, 0);
				blade.rotation.z = (b * Math.PI * 2 / 3) + Math.PI / 2;
				blade.parentTurbine = turbine;
				turbine.userData.blades = turbine.userData.blades || [];
				turbine.userData.blades.push(blade);
				damGroup.add(blade);
			}
		}
	}

	function createControlRoom() {
		// Control room structure
		var roomGeometry = new THREE.BoxGeometry(50, 25, 25);
		var roomMaterial = new THREE.MeshStandardMaterial({
			color: 0x8B7355,
			roughness: 0.6
		});
		var controlRoom = new THREE.Mesh(roomGeometry, roomMaterial);
		controlRoom.position.set(40, 48, 0);
		damGroup.add(controlRoom);

		// Windows (thin box frames)
		var windowFrameGeometry = new THREE.BoxGeometry(15, 12, 0.5);
		var windowMaterial = new THREE.MeshStandardMaterial({
			color: 0xDDDDFF,
			metalness: 0.3,
			roughness: 0.2
		});

		var windowPositions = [
			{ x: 20, y: 52, z: 13 },
			{ x: 20, y: 52, z: -13 },
			{ x: -20, y: 52, z: 13 },
			{ x: -20, y: 52, z: -13 }
		];

		for (var w = 0; w < windowPositions.length; w++) {
			var window = new THREE.Mesh(windowFrameGeometry, windowMaterial);
			window.position.set(windowPositions[w].x, windowPositions[w].y, windowPositions[w].z);
			damGroup.add(window);
		}
	}

	function createCatwalks() {
		// Horizontal catwalks on dam face
		for (var c = 0; c < 4; c++) {
			var catkalkGeometry = new THREE.BoxGeometry(200, 2, 4);
			var catkalkMaterial = new THREE.MeshStandardMaterial({
				color: 0x444444,
				metalness: 0.6
			});
			var catwalk = new THREE.Mesh(catkalkGeometry, catkalkMaterial);
			catwalk.position.set(0, -20 + c * 18, 16);
			damGroup.add(catwalk);

			// Railing on catwalk
			var railingGeometry = new THREE.BoxGeometry(200, 2, 0.8);
			var railingMaterial = new THREE.MeshStandardMaterial({
				color: 0x333333,
				metalness: 0.7
			});
			var railing = new THREE.Mesh(railingGeometry, railingMaterial);
			railing.position.set(0, -18 + c * 18, 20);
			damGroup.add(railing);

			// Vertical railing segments
			for (var r = 0; r < 20; r++) {
				var vertRailGeometry = new THREE.BoxGeometry(1, 2, 0.8);
				var vertRail = new THREE.Mesh(vertRailGeometry, railingMaterial);
				vertRail.position.set(-95 + r * 10, -19 + c * 18, 20);
				damGroup.add(vertRail);
			}
		}
	}

	function createWaterGates() {
		// Sluice gates at bottom of dam
		for (var g = 0; g < 4; g++) {
			var gateGeometry = new THREE.BoxGeometry(40, 25, 2);
			var gateMaterial = new THREE.MeshStandardMaterial({
				color: 0x444444,
				metalness: 0.8,
				roughness: 0.3
			});
			var gate = new THREE.Mesh(gateGeometry, gateMaterial);
			gate.position.set(-60 + g * 40, -35, 16);
			gate.originalPosition = gate.position.clone();
			gate.gateIndex = g;
			gates.push(gate);
			damGroup.add(gate);

			// Gate frame
			var frameGeometry = new THREE.BoxGeometry(42, 27, 1);
			var frameMaterial = new THREE.MeshStandardMaterial({
				color: 0x555555,
				metalness: 0.5
			});
			var frame = new THREE.Mesh(frameGeometry, frameMaterial);
			frame.position.set(-60 + g * 40, -35, 17);
			damGroup.add(frame);
		}
	}

	function createGunEmplacements() {
		// Gun bunkers on dam crest
		for (var b = 0; b < 3; b++) {
			var bunkerGeometry = new THREE.BoxGeometry(20, 15, 20);
			var bunkerMaterial = new THREE.MeshStandardMaterial({
				color: 0x5A5A5A,
				roughness: 0.8
			});
			var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
			bunker.position.set(-60 + b * 60, 52, 0);
			damGroup.add(bunker);

			// Gun barrel
			var barrelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 16);
			var barrelMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				metalness: 0.9,
				roughness: 0.3
			});
			var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
			barrel.rotation.z = Math.PI / 6;
			barrel.position.set(-60 + b * 60, 58, 10);
			damGroup.add(barrel);
		}
	}

	function createDownstreamRiver() {
		// Churning water below the dam
		var riverGeometry = new THREE.BoxGeometry(240, 15, 80);
		var riverMaterial = new THREE.MeshStandardMaterial({
			color: 0x4DA6FF,
			emissive: 0x002266,
			roughness: 0.5,
			metalness: 0.2,
			transparent: true,
			opacity: 0.8
		});
		var river = new THREE.Mesh(riverGeometry, riverMaterial);
		river.position.set(0, -55, 50);
		damGroup.add(river);

		// White water foam
		var foamGeometry = new THREE.BoxGeometry(240, 2, 80);
		var foamMaterial = new THREE.MeshStandardMaterial({
			color: 0xFFFFFF,
			emissive: 0xCCCCCC,
			roughness: 0.7,
			transparent: true,
			opacity: 0.6
		});
		var foam = new THREE.Mesh(foamGeometry, foamMaterial);
		foam.position.set(0, -42, 50);
		damGroup.add(foam);
	}

	function createAccessRoad() {
		// Road surface on top of dam
		var roadGeometry = new THREE.BoxGeometry(60, 2, 230);
		var roadMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			roughness: 0.8
		});
		var road = new THREE.Mesh(roadGeometry, roadMaterial);
		road.position.set(100, 52, 0);
		damGroup.add(road);

		// Guard posts along road
		for (var p = 0; p < 5; p++) {
			var postGeometry = new THREE.BoxGeometry(8, 12, 8);
			var postMaterial = new THREE.MeshStandardMaterial({
				color: 0x444444,
				roughness: 0.7
			});
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(100, 54, -100 + p * 50);
			damGroup.add(post);

			// Searchlight on post
			var searchlightGeometry = new THREE.CylinderGeometry(1, 1.5, 2, 16);
			var searchlightMaterial = new THREE.MeshStandardMaterial({
				color: 0xFFFF99,
				emissive: 0xFFFF00,
				metalness: 0.8
			});
			var searchlight = new THREE.Mesh(searchlightGeometry, searchlightMaterial);
			searchlight.position.set(100, 60, -100 + p * 50);
			damGroup.add(searchlight);
		}
	}

	function createRadarStation() {
		// Radar tower
		var towerGeometry = new THREE.CylinderGeometry(3, 4, 30, 16);
		var towerMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.7,
			roughness: 0.4
		});
		var tower = new THREE.Mesh(towerGeometry, towerMaterial);
		tower.position.set(-100, 45, 0);
		damGroup.add(tower);

		// Radar dish
		var dishGeometry = new THREE.CylinderGeometry(12, 12, 1.5, 32);
		var dishMaterial = new THREE.MeshStandardMaterial({
			color: 0xAAAA88,
			metalness: 0.85,
			roughness: 0.3
		});
		radarDish = new THREE.Mesh(dishGeometry, dishMaterial);
		radarDish.position.set(-100, 65, 0);
		radarDish.userData.rotationSpeed = 2;
		damGroup.add(radarDish);

		// Radar support arm
		var armGeometry = new THREE.BoxGeometry(3, 8, 3);
		var armMaterial = new THREE.MeshStandardMaterial({
			color: 0x777777,
			metalness: 0.7
		});
		var arm = new THREE.Mesh(armGeometry, armMaterial);
		arm.position.set(-100, 59, 0);
		damGroup.add(arm);
	}

	function createLighting() {
		// Ambient light
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		// Directional light (sun)
		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
		directionalLight.position.set(100, 100, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.camera.far = 500;
		scene.add(directionalLight);

		// Spotlight on searchlights
		var spotLight = new THREE.SpotLight(0xFFFF99, 1, 200, Math.PI / 4, 0.8, 1);
		spotLight.position.set(100, 60, -100);
		spotLight.target.position.set(100, 0, -100);
		scene.add(spotLight);
		scene.add(spotLight.target);
	}

	function update(delta) {
		time += delta;

		// Animate reservoir water surface with gentle waves
		if (reservoirWater) {
			var waveAmplitude = 0.5;
			var waveFrequency = 1;
			var posZ = -160 + Math.sin(time * waveFrequency) * waveAmplitude;
			var rotX = Math.sin(time * waveFrequency * 0.5) * 0.02;
			reservoirWater.position.z = posZ;
			reservoirWater.rotation.x = rotX;
		}

		// Animate spillway water blocks falling
		for (var s = 0; s < spillwayBlocks.length; s++) {
			var block = spillwayBlocks[s];
			var fallSpeed = 25;
			var blockPhase = (time * fallSpeed + block.rowIndex * 2) % 80;
			block.position.y = block.originalY + blockPhase - 40;
		}

		// Spin turbines
		for (var t = 0; t < turbines.length; t++) {
			var turbine = turbines[t];
			var spinSpeed = 8;
			turbine.rotation.z += delta * spinSpeed;

			// Rotate blades with turbine
			if (turbine.userData.blades) {
				for (var tb = 0; tb < turbine.userData.blades.length; tb++) {
					var blade = turbine.userData.blades[tb];
					blade.rotation.z += delta * spinSpeed;
				}
			}
		}

		// Animate water gates opening and closing
		var gateCycleLength = 4;
		var gatePhase = (time % (gateCycleLength * 2)) / gateCycleLength;
		var gateOpen = gatePhase < 1;
		var gateProgress = gateOpen ? gatePhase : (2 - gatePhase);

		for (var g = 0; g < gates.length; g++) {
			var gate = gates[g];
			var offsetY = (1 - gateProgress) * 30;
			gate.position.y = gate.originalPosition.y + offsetY;
		}

		// Rotate radar dish
		if (radarDish) {
			radarDish.rotation.y += delta * radarDish.userData.rotationSpeed;
		}
	}

	function reset() {
		if (damGroup && scene) {
			scene.remove(damGroup);
		}
		damGroup = null;
		reservoirWater = null;
		spillwayBlocks = [];
		turbines = [];
		gates = [];
		radarDish = null;
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
