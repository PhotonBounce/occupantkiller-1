window.AcidBay = (function() {
	'use strict';

	// Module state
	var scene;
	var camera;
	var dynamicElements = [];
	var acidWaterGeometry;
	var acidMaterial;
	var time = 0;

	// Material colors for visual variety
	var rustMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.4, roughness: 0.8 });
	var corrodedMaterial = new THREE.MeshStandardMaterial({ color: 0x6B5D4F, metalness: 0.3, roughness: 0.9 });
	var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x7A7A7A, metalness: 0.1, roughness: 0.95 });
	var acidGlowMaterial = new THREE.MeshStandardMaterial({ color: 0xCDFF00, emissive: 0x99CC00, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.4 });
	var tankerMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.8, roughness: 0.3 });
	var bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x5A5A5A, metalness: 0.1, roughness: 0.9 });

	// Initialize the environment
	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		time = 0;

		// Set up basic scene lighting
		var ambientLight = new THREE.AmbientLight(0xcccccc, 0.8);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
		directionalLight.position.set(40, 50, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);

		// Acid water plane geometry (using line segments to avoid PlaneGeometry)
		createAcidWater();

		// Causeway structure - main elevated walkway
		createCauseway();

		// Shipping containers (corroded)
		createShippingContainers();

		// Crane structure
		createCraneStructure();

		// Chemical tanker ship
		createTankerShip();

		// Shore bunkers
		createShoreBunkers();

		// Neutralization plant (failed)
		createNeutralizationPlant();

		// Protective shield barriers
		createShieldBarriers();

		// Dock platforms
		createDockPlatforms();

		// Acid drip effect sources
		createDripEffectSources();

		// Miscellaneous corroded structures
		createMiscStructures();

		return {
			init: init,
			update: update,
			reset: reset
		};
	}

	// Create acid water surface (visualized with spheres at different heights)
	function createAcidWater() {
		var waterCylinder = new THREE.Mesh(
			new THREE.CylinderGeometry(50, 50, 8, 32),
			acidGlowMaterial
		);
		waterCylinder.position.y = -4;
		waterCylinder.castShadow = true;
		waterCylinder.receiveShadow = true;
		scene.add(waterCylinder);

		dynamicElements.push({
			mesh: waterCylinder,
			type: 'acid_water',
			baseY: -4
		});
	}

	// Create elevated causeway on concrete pillars
	function createCauseway() {
		// Concrete pillars
		for (var i = 0; i < 5; i++) {
			var pillar = new THREE.Mesh(
				new THREE.CylinderGeometry(3, 3.5, 20, 16),
				concreteMaterial
			);
			pillar.position.set(-30 + i * 15, 0, 0);
			pillar.castShadow = true;
			pillar.receiveShadow = true;
			scene.add(pillar);
		}

		// Causeway platform
		var catwalkLeft = new THREE.Mesh(
			new THREE.BoxGeometry(75, 2, 6),
			concreteMaterial
		);
		catwalkLeft.position.set(0, 10, 0);
		catwalkLeft.castShadow = true;
		catwalkLeft.receiveShadow = true;
		scene.add(catwalkLeft);

		// Side railing (using cylinders as posts)
		for (var i = 0; i < 8; i++) {
			var railPost = new THREE.Mesh(
				new THREE.CylinderGeometry(0.4, 0.4, 3, 8),
				rustMaterial
			);
			railPost.position.set(-35 + i * 10, 12, 3.5);
			railPost.castShadow = true;
			scene.add(railPost);
		}
	}

	// Create corroded shipping containers for cover
	function createShippingContainers() {
		var containerPositions = [
			{ x: -35, y: 5, z: 15 },
			{ x: -15, y: 5, z: 20 },
			{ x: 5, y: 6, z: 18 },
			{ x: 25, y: 5, z: 22 },
			{ x: 35, y: 7, z: 10 }
		];

		containerPositions.forEach(function(pos) {
			// Main container box
			var container = new THREE.Mesh(
				new THREE.BoxGeometry(8, 10, 6),
				corrodedMaterial
			);
			container.position.set(pos.x, pos.y, pos.z);
			container.castShadow = true;
			container.receiveShadow = true;
			scene.add(container);

			// Corroded hole effect (sphere cutout visual)
			var corrosionHole = new THREE.Mesh(
				new THREE.SphereGeometry(1.5, 8, 8),
				acidGlowMaterial
			);
			corrosionHole.position.set(pos.x - 2, pos.y + 2, pos.z + 3.5);
			scene.add(corrosionHole);

			dynamicElements.push({
				mesh: corrosionHole,
				type: 'corrosion_glow',
				baseX: corrosionHole.position.x,
				baseY: corrosionHole.position.y,
				baseZ: corrosionHole.position.z
			});
		});
	}

	// Create tall crane structure
	function createCraneStructure() {
		// Crane base columns
		var craneBase1 = new THREE.Mesh(
			new THREE.CylinderGeometry(2, 2.5, 8, 12),
			rustMaterial
		);
		craneBase1.position.set(-40, 4, -25);
		craneBase1.castShadow = true;
		scene.add(craneBase1);

		var craneBase2 = new THREE.Mesh(
			new THREE.CylinderGeometry(2, 2.5, 8, 12),
			rustMaterial
		);
		craneBase2.position.set(-40, 4, 25);
		craneBase2.castShadow = true;
		scene.add(craneBase2);

		// Vertical crane tower
		var craneTower = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 35, 12),
			rustMaterial
		);
		craneTower.position.set(-40, 20, 0);
		craneTower.castShadow = true;
		scene.add(craneTower);

		// Crane boom arm
		var boomArm = new THREE.Mesh(
			new THREE.CylinderGeometry(0.6, 0.6, 30, 12),
			rustMaterial
		);
		boomArm.rotation.z = Math.PI / 6;
		boomArm.position.set(-25, 32, 0);
		boomArm.castShadow = true;
		scene.add(boomArm);

		// Crane hook machinery (sphere)
		var craneHook = new THREE.Mesh(
			new THREE.SphereGeometry(1.5, 12, 12),
			tankerMetalMaterial
		);
		craneHook.position.set(-10, 30, 0);
		craneHook.castShadow = true;
		dynamicElements.push({
			mesh: craneHook,
			type: 'crane_hook',
			baseY: 30,
			amplitude: 2
		});
		scene.add(craneHook);
	}

	// Create chemical tanker ship with corroded hull
	function createTankerShip() {
		// Ship hull
		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(25, 12, 8),
			tankerMetalMaterial
		);
		hull.position.set(30, 3, -30);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);

		// Superstructure (bridge)
		var bridge = new THREE.Mesh(
			new THREE.BoxGeometry(8, 8, 6),
			tankerMetalMaterial
		);
		bridge.position.set(20, 10, -28);
		bridge.castShadow = true;
		scene.add(bridge);

		// Cargo tank cylinder
		var cargoTank = new THREE.Mesh(
			new THREE.CylinderGeometry(5, 5, 20, 16),
			tankerMetalMaterial
		);
		cargoTank.rotation.z = Math.PI / 2;
		cargoTank.position.set(30, 6, -30);
		cargoTank.castShadow = true;
		scene.add(cargoTank);

		// Hull breach (glowing hole)
		var hullBreach = new THREE.Mesh(
			new THREE.SphereGeometry(2.5, 12, 12),
			acidGlowMaterial
		);
		hullBreach.position.set(35, 2, -28);
		scene.add(hullBreach);

		dynamicElements.push({
			mesh: hullBreach,
			type: 'hull_breach',
			baseY: 2
		});
	}

	// Create shore-based acid-resistant bunkers
	function createShoreBunkers() {
		var bunkerPositions = [
			{ x: -50, z: -35 },
			{ x: -45, z: 35 },
			{ x: 50, z: -40 }
		];

		bunkerPositions.forEach(function(pos) {
			// Main bunker box
			var bunker = new THREE.Mesh(
				new THREE.BoxGeometry(12, 8, 10),
				bunkerMaterial
			);
			bunker.position.set(pos.x, 4, pos.z);
			bunker.castShadow = true;
			bunker.receiveShadow = true;
			scene.add(bunker);

			// Bunker entrance reinforcement (cylinder)
			var entrance = new THREE.Mesh(
				new THREE.CylinderGeometry(2.5, 2.5, 5, 12),
				concreteMaterial
			);
			entrance.position.set(pos.x - 5, 3, pos.z);
			entrance.castShadow = true;
			scene.add(entrance);

			// Ventilation pipe (tall cylinder)
			var ventPipe = new THREE.Mesh(
				new THREE.CylinderGeometry(0.8, 0.8, 8, 8),
				rustMaterial
			);
			ventPipe.position.set(pos.x + 4, 10, pos.z + 3);
			ventPipe.castShadow = true;
			scene.add(ventPipe);
		});
	}

	// Create failed neutralization plant structure
	function createNeutralizationPlant() {
		// Main processing tanks
		var tankPositions = [
			{ x: 15, z: -15 },
			{ x: 22, z: -18 },
			{ x: 20, z: -8 }
		];

		tankPositions.forEach(function(pos) {
			var tank = new THREE.Mesh(
				new THREE.CylinderGeometry(3, 3, 12, 12),
				corrodedMaterial
			);
			tank.position.set(pos.x, 6, pos.z);
			tank.castShadow = true;
			scene.add(tank);

			// Corroded top (cone)
			var tankTop = new THREE.Mesh(
				new THREE.ConeGeometry(3.2, 2, 12),
				rustMaterial
			);
			tankTop.position.set(pos.x, 12.5, pos.z);
			tankTop.castShadow = true;
			scene.add(tankTop);
		});

		// Overhead piping framework (using cylinders)
		var pipeFrame = new THREE.Mesh(
			new THREE.BoxGeometry(20, 1.5, 12),
			rustMaterial
		);
		pipeFrame.position.set(18, 14, -13);
		pipeFrame.castShadow = true;
		scene.add(pipeFrame);

		// Failed reactor core (glowing sphere)
		var reactorCore = new THREE.Mesh(
			new THREE.SphereGeometry(2, 16, 16),
			acidGlowMaterial
		);
		reactorCore.position.set(18, 10, -5);
		scene.add(reactorCore);

		dynamicElements.push({
			mesh: reactorCore,
			type: 'reactor_core',
			baseY: 10,
			amplitude: 1.5
		});
	}

	// Create protective shield barriers
	function createShieldBarriers() {
		var barrierSegments = [
			{ x: 0, z: 10 },
			{ x: 0, z: -10 },
			{ x: -20, z: 0 },
			{ x: 20, z: 0 }
		];

		barrierSegments.forEach(function(pos) {
			var barrier = new THREE.Mesh(
				new THREE.BoxGeometry(3, 4, 12),
				concreteMaterial
			);
			barrier.position.set(pos.x, 2, pos.z);
			barrier.castShadow = true;
			barrier.receiveShadow = true;
			scene.add(barrier);
		});
	}

	// Create dock platforms at various heights
	function createDockPlatforms() {
		// Lower dock platform
		var dockLower = new THREE.Mesh(
			new THREE.BoxGeometry(20, 1.5, 15),
			corrodedMaterial
		);
		dockLower.position.set(-20, 2, -25);
		dockLower.castShadow = true;
		dockLower.receiveShadow = true;
		scene.add(dockLower);

		// Mid dock platform
		var dockMid = new THREE.Mesh(
			new THREE.BoxGeometry(18, 1.5, 12),
			corrodedMaterial
		);
		dockMid.position.set(10, 4, -20);
		dockMid.castShadow = true;
		scene.add(dockMid);

		// Support pillars for platforms
		for (var i = 0; i < 4; i++) {
			var dockPillar = new THREE.Mesh(
				new THREE.CylinderGeometry(1.5, 1.5, 5, 10),
				concreteMaterial
			);
			dockPillar.position.set(-25 + i * 8, 1.5, -25);
			dockPillar.castShadow = true;
			scene.add(dockPillar);
		}
	}

	// Create dripping acid effect source structures
	function createDripEffectSources() {
		var dripSources = [
			{ x: -30, y: 15, z: 5 },
			{ x: 0, y: 12, z: -10 },
			{ x: 20, y: 14, z: 8 }
		];

		dripSources.forEach(function(pos) {
			// Source vent (small cylinder)
			var vent = new THREE.Mesh(
				new THREE.CylinderGeometry(0.5, 0.5, 2, 8),
				rustMaterial
			);
			vent.position.set(pos.x, pos.y, pos.z);
			vent.castShadow = true;
			scene.add(vent);

			// Drip particle effect (sphere that moves down)
			var dripParticle = new THREE.Mesh(
				new THREE.SphereGeometry(0.3, 6, 6),
				acidGlowMaterial
			);
			dripParticle.position.set(pos.x, pos.y - 1, pos.z);
			scene.add(dripParticle);

			dynamicElements.push({
				mesh: dripParticle,
				type: 'acid_drip',
				baseX: pos.x,
				baseY: pos.y - 1,
				baseZ: pos.z,
				dripOffset: Math.random() * Math.PI * 2
			});
		});
	}

	// Create miscellaneous corroded structures and decorative elements
	function createMiscStructures() {
		// Acid-eaten catwalk grating sections
		for (var i = 0; i < 6; i++) {
			var gratingSection = new THREE.Mesh(
				new THREE.BoxGeometry(5, 0.3, 4),
				corrodedMaterial
			);
			gratingSection.position.set(-35 + i * 12, 9, 15);
			gratingSection.castShadow = true;
			gratingSection.receiveShadow = true;
			scene.add(gratingSection);
		}

		// Corrosion effect spheres (scattered around)
		for (var i = 0; i < 5; i++) {
			var corrosionSphere = new THREE.Mesh(
				new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 8, 8),
				rustMaterial
			);
			corrosionSphere.position.set(
				-40 + Math.random() * 80,
				1 + Math.random() * 3,
				-40 + Math.random() * 80
			);
			corrosionSphere.castShadow = true;
			scene.add(corrosionSphere);
		}

		// Overhead acid spray equipment (cones as sprayers)
		for (var i = 0; i < 4; i++) {
			var sprayer = new THREE.Mesh(
				new THREE.ConeGeometry(0.8, 2.5, 12),
				rustMaterial
			);
			sprayer.rotation.x = Math.PI / 2.5;
			sprayer.position.set(
				-30 + i * 20,
				16,
				-15 + (i % 2) * 30
			);
			sprayer.castShadow = true;
			scene.add(sprayer);
		}

		// Structural support struts (box beams)
		var strutPositions = [
			{ x: -15, y: 9, z: 0 },
			{ x: 15, y: 8, z: -5 },
			{ x: 0, y: 11, z: 15 }
		];

		strutPositions.forEach(function(pos) {
			var strut = new THREE.Mesh(
				new THREE.BoxGeometry(2, 8, 2),
				rustMaterial
			);
			strut.position.set(pos.x, pos.y, pos.z);
			strut.castShadow = true;
			scene.add(strut);
		});
	}

	// Update function with dynamic effects
	function update(delta) {
		time += delta;

		dynamicElements.forEach(function(element) {
			switch(element.type) {
				case 'acid_water':
					// Subtle water ripple effect
					element.mesh.position.y = element.baseY + Math.sin(time * 0.5) * 0.3;
					break;

				case 'corrosion_glow':
					// Pulsing glow effect for corroded areas
					element.mesh.scale.set(
						1 + Math.sin(time * 2.5) * 0.2,
						1 + Math.sin(time * 2.5) * 0.2,
						1 + Math.sin(time * 2.5) * 0.2
					);
					break;

				case 'crane_hook':
					// Swinging crane hook motion
					element.mesh.position.y = element.baseY + Math.sin(time * 0.8) * element.amplitude;
					element.mesh.position.x = -10 + Math.cos(time * 0.6) * 3;
					break;

				case 'hull_breach':
					// Glowing breach pulsation
					element.mesh.scale.set(
						1 + Math.sin(time * 1.8) * 0.15,
						1 + Math.sin(time * 1.8) * 0.15,
						1 + Math.sin(time * 1.8) * 0.15
					);
					break;

				case 'reactor_core':
					// Reactor core pulsing and spinning
					element.mesh.rotation.x += delta * 0.3;
					element.mesh.rotation.y += delta * 0.5;
					element.mesh.position.y = element.baseY + Math.sin(time * 1.2) * element.amplitude;
					element.mesh.scale.set(
						1 + Math.sin(time * 2.0) * 0.1,
						1 + Math.sin(time * 2.0) * 0.1,
						1 + Math.sin(time * 2.0) * 0.1
					);
					break;

				case 'acid_drip':
					// Acid drip falling and respawning
					var dripPhase = (time + element.dripOffset) % 3;
					var fallDistance = dripPhase * 8;
					element.mesh.position.y = element.baseY - fallDistance;
					if (element.mesh.position.y < element.baseY - 8) {
						element.mesh.position.y = element.baseY;
					}
					element.mesh.scale.set(
						1 - (dripPhase / 3) * 0.5,
						1 - (dripPhase / 3) * 0.5,
						1 - (dripPhase / 3) * 0.5
					);
					break;

				default:
					break;
			}
		});
	}

	// Reset function
	function reset() {
		time = 0;
		dynamicElements.forEach(function(element) {
			element.mesh.scale.set(1, 1, 1);
			element.mesh.rotation.set(0, 0, 0);
		});
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
