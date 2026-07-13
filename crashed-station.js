window.CrashedStation = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var gameObjects = [];
	var reactorMesh = null;
	var beaconMesh = null;
	var beaconLight = null;
	var debrisObjects = [];
	var windParticles = [];
	var emergencyLights = [];
	var time = 0;

	function init(inputScene, inputCamera) {
		scene = inputScene;
		camera = inputCamera;
		gameObjects = [];
		debrisObjects = [];
		windParticles = [];
		emergencyLights = [];
		time = 0;

		// Create main station hull sections tilted at angles
		createHullSections();

		// Create impact crater depression in snow
		createImpactCrater();

		// Create solar panels (some deployed, some torn)
		createSolarPanels();

		// Create pressurized corridors with emergency lighting
		createCorridor();

		// Create command module (tilted room)
		createCommandModule();

		// Create reactor core (CylinderGeometry with glow)
		createReactorCore();

		// Create escape pod bay
		createEscapePodBay();

		// Create hull breach with particles
		createHullBreach();

		// Create arctic snow terrain
		createSnowTerrain();

		// Create distress beacon
		createDistressBeacon();

		// Create floating debris
		createFloatingDebris();
	}

	function createHullSections() {
		var hullMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.8,
			roughness: 0.3
		});

		// Main fuselage section 1
		var hull1Geom = new THREE.BoxGeometry(40, 15, 60);
		var hull1 = new THREE.Mesh(hull1Geom, hullMaterial);
		hull1.position.set(0, 5, 0);
		hull1.rotation.z = 0.3;
		scene.add(hull1);
		gameObjects.push(hull1);

		// Hull section 2 (tilted differently)
		var hull2Geom = new THREE.BoxGeometry(35, 12, 50);
		var hull2 = new THREE.Mesh(hull2Geom, hullMaterial);
		hull2.position.set(25, 8, -20);
		hull2.rotation.z = -0.25;
		hull2.rotation.x = 0.15;
		scene.add(hull2);
		gameObjects.push(hull2);

		// Hull section 3 (docking module)
		var hull3Geom = new THREE.BoxGeometry(30, 10, 40);
		var hull3 = new THREE.Mesh(hull3Geom, hullMaterial);
		hull3.position.set(-20, 6, 15);
		hull3.rotation.z = 0.4;
		scene.add(hull3);
		gameObjects.push(hull3);

		// Partially buried nose section
		var noseMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.9,
			roughness: 0.2
		});
		var noseGeom = new THREE.BoxGeometry(25, 20, 35);
		var nose = new THREE.Mesh(noseGeom, noseMaterial);
		nose.position.set(-5, -10, -40);
		nose.rotation.z = 0.5;
		nose.rotation.x = 0.2;
		scene.add(nose);
		gameObjects.push(nose);
	}

	function createImpactCrater() {
		var snowMaterial = new THREE.MeshStandardMaterial({
			color: 0xf0f8ff,
			metalness: 0.1,
			roughness: 0.9
		});

		// Crater depression
		var craterGeom = new THREE.BoxGeometry(80, 8, 90);
		var crater = new THREE.Mesh(craterGeom, snowMaterial);
		crater.position.set(0, -20, 0);
		scene.add(crater);
		gameObjects.push(crater);

		// Crater rim blocks
		var rimMaterial = new THREE.MeshStandardMaterial({
			color: 0xf5f5f5,
			metalness: 0.05,
			roughness: 0.95
		});

		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var rimGeom = new THREE.BoxGeometry(12, 6, 20);
			var rimBlock = new THREE.Mesh(rimGeom, rimMaterial);
			rimBlock.position.set(
				Math.cos(angle) * 50,
				-15,
				Math.sin(angle) * 50
			);
			scene.add(rimBlock);
			gameObjects.push(rimBlock);
		}
	}

	function createSolarPanels() {
		var panelMaterial = new THREE.MeshStandardMaterial({
			color: 0x2a5a8a,
			metalness: 0.7,
			roughness: 0.2
		});

		// Deployed solar panels (still working)
		var panel1Geom = new THREE.BoxGeometry(15, 2, 25);
		var panel1 = new THREE.Mesh(panel1Geom, panelMaterial);
		panel1.position.set(-40, 18, 10);
		panel1.rotation.x = 0.3;
		scene.add(panel1);
		gameObjects.push(panel1);

		// Torn solar panel 1
		var tarnMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a3a5a,
			metalness: 0.6,
			roughness: 0.4
		});
		var panel2Geom = new THREE.BoxGeometry(14, 2, 12);
		var panel2 = new THREE.Mesh(panel2Geom, tarnMaterial);
		panel2.position.set(35, 15, -30);
		panel2.rotation.z = 0.8;
		panel2.rotation.x = 0.4;
		scene.add(panel2);
		gameObjects.push(panel2);

		// Partially detached panel
		var panel3Geom = new THREE.BoxGeometry(16, 2, 24);
		var panel3 = new THREE.Mesh(panel3Geom, panelMaterial);
		panel3.position.set(40, 12, 20);
		panel3.rotation.x = -0.5;
		panel3.rotation.z = 0.6;
		scene.add(panel3);
		gameObjects.push(panel3);
	}

	function createCorridor() {
		var corridorMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.5,
			roughness: 0.5
		});

		// Main corridor tunnel
		var corridorGeom = new THREE.BoxGeometry(8, 8, 40);
		var corridor = new THREE.Mesh(corridorGeom, corridorMaterial);
		corridor.position.set(-15, 2, 5);
		corridor.rotation.z = 0.2;
		scene.add(corridor);
		gameObjects.push(corridor);

		// Emergency lighting - red spheres
		var lightMaterial = new THREE.MeshBasicMaterial({
			color: 0xff3333,
			emissive: 0xff3333
		});

		for (var i = 0; i < 5; i++) {
			var lightGeom = new THREE.SphereGeometry(0.8, 8, 8);
			var light = new THREE.Mesh(lightGeom, lightMaterial);
			light.position.set(-15, 6, -10 + i * 10);
			scene.add(light);
			emergencyLights.push(light);
		}
	}

	function createCommandModule() {
		var cmdMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.6,
			roughness: 0.4
		});

		// Command room box
		var cmdGeom = new THREE.BoxGeometry(20, 18, 25);
		var cmdModule = new THREE.Mesh(cmdGeom, cmdMaterial);
		cmdModule.position.set(-8, 12, -30);
		cmdModule.rotation.z = -0.35;
		cmdModule.rotation.x = 0.1;
		scene.add(cmdModule);
		gameObjects.push(cmdModule);

		// Instrument panels
		var panelMaterial = new THREE.MeshStandardMaterial({
			color: 0x222222,
			metalness: 0.8,
			roughness: 0.3
		});

		for (var i = 0; i < 3; i++) {
			var panelGeom = new THREE.BoxGeometry(4, 10, 0.5);
			var panel = new THREE.Mesh(panelGeom, panelMaterial);
			panel.position.set(-8 + i * 8, 8, -35);
			panel.rotation.z = -0.35;
			scene.add(panel);
			gameObjects.push(panel);
		}
	}

	function createReactorCore() {
		// Reactor chamber (CylinderGeometry)
		var reactorMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.7,
			roughness: 0.3
		});

		var reactorGeom = new THREE.CylinderGeometry(12, 12, 25, 16);
		reactorMesh = new THREE.Mesh(reactorGeom, reactorMaterial);
		reactorMesh.position.set(0, 0, -60);
		scene.add(reactorMesh);
		gameObjects.push(reactorMesh);

		// Glowing core inner cylinder
		var coreMaterial = new THREE.MeshBasicMaterial({
			color: 0xffaa00,
			emissive: 0xffaa00
		});

		var coreGeom = new THREE.CylinderGeometry(8, 8, 20, 16);
		var core = new THREE.Mesh(coreGeom, coreMaterial);
		core.position.set(0, 0, -60);
		scene.add(core);
		gameObjects.push(core);

		// Reactor cooling rings
		var ringMaterial = new THREE.MeshStandardMaterial({
			color: 0x888888,
			metalness: 0.9,
			roughness: 0.2
		});

		for (var i = 0; i < 5; i++) {
			var ringGeom = new THREE.CylinderGeometry(13, 13, 1.5, 16);
			var ring = new THREE.Mesh(ringGeom, ringMaterial);
			ring.position.set(0, -8 + i * 4, -60);
			scene.add(ring);
			gameObjects.push(ring);
		}
	}

	function createEscapePodBay() {
		// Row of escape pods (CylinderGeometry)
		var podMaterial = new THREE.MeshStandardMaterial({
			color: 0xffaa33,
			metalness: 0.7,
			roughness: 0.3
		});

		var emptyMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.8,
			roughness: 0.5
		});

		for (var i = 0; i < 6; i++) {
			var deployed = i < 2;
			var material = deployed ? emptyMaterial : podMaterial;
			var podGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 8);
			var pod = new THREE.Mesh(podGeom, material);
			pod.position.set(15 + i * 8, 5, 40);
			scene.add(pod);
			gameObjects.push(pod);
		}
	}

	function createHullBreach() {
		// Torn open breach BoxGeometry
		var breachMaterial = new THREE.MeshStandardMaterial({
			color: 0x222222,
			metalness: 0.9,
			roughness: 0.2
		});

		var breachGeom = new THREE.BoxGeometry(18, 14, 0.5);
		var breach = new THREE.Mesh(breachGeom, breachMaterial);
		breach.position.set(45, 8, 15);
		breach.rotation.z = 0.3;
		scene.add(breach);
		gameObjects.push(breach);

		// Cold air particles (SphereGeometry)
		var particleMaterial = new THREE.MeshBasicMaterial({
			color: 0xddddff,
			transparent: true,
			opacity: 0.5
		});

		for (var i = 0; i < 20; i++) {
			var particleGeom = new THREE.SphereGeometry(0.3, 4, 4);
			var particle = new THREE.Mesh(particleGeom, particleMaterial);
			particle.position.set(
				45 + (Math.random() - 0.5) * 15,
				8 + (Math.random() - 0.5) * 10,
				15 + Math.random() * 5
			);
			scene.add(particle);
			windParticles.push({
				mesh: particle,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.3,
				vz: Math.random() * 0.4,
				life: Math.random() * 3
			});
		}
	}

	function createSnowTerrain() {
		var snowMaterial = new THREE.MeshStandardMaterial({
			color: 0xf8f8f8,
			metalness: 0.05,
			roughness: 0.95
		});

		// Snow terrain blocks scattered around
		for (var i = 0; i < 12; i++) {
			var snowGeom = new THREE.BoxGeometry(
				15 + Math.random() * 20,
				5 + Math.random() * 8,
				20 + Math.random() * 25
			);
			var snowBlock = new THREE.Mesh(snowGeom, snowMaterial);
			var angle = (i / 12) * Math.PI * 2;
			snowBlock.position.set(
				Math.cos(angle) * (60 + Math.random() * 30),
				-18 + Math.random() * 2,
				Math.sin(angle) * (60 + Math.random() * 30)
			);
			snowBlock.rotation.z = (Math.random() - 0.5) * 0.4;
			scene.add(snowBlock);
			gameObjects.push(snowBlock);
		}
	}

	function createDistressBeacon() {
		// Beacon base (CylinderGeometry)
		var beaconBaseMaterial = new THREE.MeshStandardMaterial({
			color: 0xffff00,
			metalness: 0.8,
			roughness: 0.3
		});

		var baseGeom = new THREE.CylinderGeometry(2, 2, 3, 8);
		var beaconBase = new THREE.Mesh(baseGeom, beaconBaseMaterial);
		beaconBase.position.set(50, 15, -50);
		scene.add(beaconBase);
		gameObjects.push(beaconBase);

		// Beacon transmitter (spinning CylinderGeometry)
		var transmitterGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
		beaconMesh = new THREE.Mesh(transmitterGeom, beaconBaseMaterial);
		beaconMesh.position.set(50, 18, -50);
		scene.add(beaconMesh);
		gameObjects.push(beaconMesh);

		// Flashing light (SphereGeometry)
		var lightMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			emissive: 0xffff00
		});

		var lightGeom = new THREE.SphereGeometry(1.2, 8, 8);
		beaconLight = new THREE.Mesh(lightGeom, lightMaterial);
		beaconLight.position.set(50, 24, -50);
		scene.add(beaconLight);
		gameObjects.push(beaconLight);
	}

	function createFloatingDebris() {
		var debrisMaterial = new THREE.MeshStandardMaterial({
			color: 0xaaaaaa,
			metalness: 0.7,
			roughness: 0.4
		});

		// Equipment boxes floating in zero-g
		for (var i = 0; i < 8; i++) {
			var debrisGeom = new THREE.BoxGeometry(
				2 + Math.random() * 3,
				2 + Math.random() * 3,
				2 + Math.random() * 3
			);
			var debris = new THREE.Mesh(debrisGeom, debrisMaterial);
			debris.position.set(
				(Math.random() - 0.5) * 60,
				(Math.random() - 0.5) * 40 + 10,
				(Math.random() - 0.5) * 80
			);
			scene.add(debris);
			debrisObjects.push({
				mesh: debris,
				rotVx: (Math.random() - 0.5) * 0.03,
				rotVy: (Math.random() - 0.5) * 0.03,
				rotVz: (Math.random() - 0.5) * 0.03,
				floatX: Math.random() * 0.5,
				floatY: Math.random() * 0.5,
				floatZ: Math.random() * 0.5
			});
		}
	}

	function update(delta) {
		time += delta;

		// Animate reactor core glow (pulsing)
		if (reactorMesh) {
			var glowIntensity = 0.7 + Math.sin(time * 2) * 0.3;
			reactorMesh.material.emissiveIntensity = glowIntensity * 0.5;
		}

		// Animate beacon transmission
		if (beaconMesh) {
			beaconMesh.rotation.y += delta * 4;
		}

		if (beaconLight) {
			var beaconBrightness = 0.5 + Math.sin(time * 3) * 0.5;
			beaconLight.material.emissiveIntensity = beaconBrightness;
			beaconLight.scale.set(
				1 + beaconBrightness * 0.2,
				1 + beaconBrightness * 0.2,
				1 + beaconBrightness * 0.2
			);
		}

		// Animate debris floating and rotation
		for (var i = 0; i < debrisObjects.length; i++) {
			var deb = debrisObjects[i];
			deb.mesh.rotation.x += deb.rotVx;
			deb.mesh.rotation.y += deb.rotVy;
			deb.mesh.rotation.z += deb.rotVz;
			deb.mesh.position.x += Math.sin(time + i) * deb.floatX * delta;
			deb.mesh.position.y += Math.cos(time * 0.7 + i) * deb.floatY * delta;
			deb.mesh.position.z += Math.sin(time * 0.5 + i) * deb.floatZ * delta;
		}

		// Animate wind particles
		for (var j = 0; j < windParticles.length; j++) {
			var wind = windParticles[j];
			wind.mesh.position.x += wind.vx;
			wind.mesh.position.y += wind.vy;
			wind.mesh.position.z += wind.vz;
			wind.life -= delta;

			if (wind.life <= 0) {
				scene.remove(wind.mesh);
				windParticles.splice(j, 1);
				j--;
			} else {
				wind.mesh.material.opacity = (wind.life / 3) * 0.5;
			}
		}

		// Animate emergency lights (flicker)
		for (var k = 0; k < emergencyLights.length; k++) {
			var light = emergencyLights[k];
			var flicker = 0.5 + Math.sin(time * 5 + k) * 0.5;
			light.material.emissiveIntensity = flicker;
		}

		// Regenerate wind particles occasionally
		if (windParticles.length < 15 && Math.random() < 0.05) {
			var particleMaterial = new THREE.MeshBasicMaterial({
				color: 0xddddff,
				transparent: true,
				opacity: 0.5
			});

			var particleGeom = new THREE.SphereGeometry(0.3, 4, 4);
			var particle = new THREE.Mesh(particleGeom, particleMaterial);
			particle.position.set(
				45 + (Math.random() - 0.5) * 15,
				8 + (Math.random() - 0.5) * 10,
				15 + Math.random() * 2
			);
			scene.add(particle);
			windParticles.push({
				mesh: particle,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.3,
				vz: Math.random() * 0.4,
				life: Math.random() * 3
			});
		}
	}

	function reset() {
		// Clear all objects from scene
		for (var i = gameObjects.length - 1; i >= 0; i--) {
			scene.remove(gameObjects[i]);
		}
		for (var j = windParticles.length - 1; j >= 0; j--) {
			scene.remove(windParticles[j].mesh);
		}
		for (var k = emergencyLights.length - 1; k >= 0; k--) {
			scene.remove(emergencyLights[k]);
		}
		for (var m = debrisObjects.length - 1; m >= 0; m--) {
			scene.remove(debrisObjects[m].mesh);
		}

		gameObjects = [];
		windParticles = [];
		emergencyLights = [];
		debrisObjects = [];
		reactorMesh = null;
		beaconMesh = null;
		beaconLight = null;
		time = 0;

		// Reinitialize
		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
