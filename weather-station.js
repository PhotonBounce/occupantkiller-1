window.WeatherStation = (function() {
	'use strict';

	var objects = [];
	var animationState = {
		radarRotation: 0,
		anemometerRotation: 0,
		satelliteRotation: 0,
		lightningFlash: 0,
		balloonHeight: 0,
		windmillRotation: 0
	};

	var materials = {
		metal: null,
		concrete: null,
		plastic: null,
		copper: null,
		rubber: null
	};

	var radarGroup = null;
	var anemometerGroup = null;
	var satelliteGroup = null;
	var lightningGroup = null;
	var balloonGroup = null;
	var windmillGroup = null;

	function initMaterials() {
		materials.metal = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
		materials.concrete = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.0, roughness: 0.8 });
		materials.plastic = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.0, roughness: 0.5 });
		materials.copper = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.3 });
		materials.rubber = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.0, roughness: 0.9 });
	}

	function createRadarDome(scene) {
		radarGroup = new THREE.Group();

		// Radar tower base
		var baseTowerGeom = new THREE.CylinderGeometry(1.5, 2, 0.5, 8);
		var baseTower = new THREE.Mesh(baseTowerGeom, materials.concrete);
		baseTower.position.set(0, 0, 0);
		baseTower.castShadow = true;
		radarGroup.add(baseTower);

		// Tall tower column
		var towerGeom = new THREE.CylinderGeometry(0.3, 0.4, 8, 8);
		var tower = new THREE.Mesh(towerGeom, materials.metal);
		tower.position.set(0, 4, 0);
		tower.castShadow = true;
		radarGroup.add(tower);

		// Radar dome (sphere)
		var domeGeom = new THREE.SphereGeometry(1.2, 16, 16);
		var dome = new THREE.Mesh(domeGeom, materials.plastic);
		dome.position.set(0, 9, 0);
		dome.castShadow = true;
		radarGroup.add(dome);

		// Dome support ring
		var supportGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12);
		var support = new THREE.Mesh(supportGeom, materials.metal);
		support.position.set(0, 7.8, 0);
		radarGroup.add(support);

		radarGroup.position.set(-15, 0, 10);
		scene.add(radarGroup);
	}

	function createWindMast(scene) {
		anemometerGroup = new THREE.Group();

		// Mast base
		var mastBaseGeom = new THREE.CylinderGeometry(1, 1.5, 0.3, 8);
		var mastBase = new THREE.Mesh(mastBaseGeom, materials.concrete);
		mastBase.position.set(0, 0, 0);
		mastBase.castShadow = true;
		anemometerGroup.add(mastBase);

		// Mast column
		var mastGeom = new THREE.CylinderGeometry(0.2, 0.25, 6, 6);
		var mast = new THREE.Mesh(mastGeom, materials.metal);
		mast.position.set(0, 3, 0);
		mast.castShadow = true;
		anemometerGroup.add(mast);

		// Anemometer cups (3x)
		for (var i = 0; i < 3; i++) {
			var angle = (i / 3) * Math.PI * 2;
			var cupGeom = new THREE.SphereGeometry(0.3, 8, 8);
			var cup = new THREE.Mesh(cupGeom, materials.plastic);
			cup.position.set(Math.cos(angle) * 1.5, 5.5, Math.sin(angle) * 1.5);
			cup.scale.set(1, 0.7, 1);
			cup.castShadow = true;
			anemometerGroup.add(cup);
		}

		// Center hub
		var hubGeom = new THREE.SphereGeometry(0.25, 8, 8);
		var hub = new THREE.Mesh(hubGeom, materials.metal);
		hub.position.set(0, 5.5, 0);
		hub.castShadow = true;
		anemometerGroup.add(hub);

		anemometerGroup.position.set(12, 0, 8);
		scene.add(anemometerGroup);
	}

	function createSatelliteDishArray(scene) {
		satelliteGroup = new THREE.Group();

		// Array base platform
		var platformGeom = new THREE.CylinderGeometry(3, 3.5, 0.5, 16);
		var platform = new THREE.Mesh(platformGeom, materials.concrete);
		platform.position.set(0, 0, 0);
		platform.castShadow = true;
		satelliteGroup.add(platform);

		// Create 4 satellite dishes
		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var x = Math.cos(angle) * 2;
			var z = Math.sin(angle) * 2;

			// Dish support pole
			var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 2, 6);
			var pole = new THREE.Mesh(poleGeom, materials.metal);
			pole.position.set(x, 1, z);
			pole.castShadow = true;
			satelliteGroup.add(pole);

			// Dish mount
			var mountGeom = new THREE.SphereGeometry(0.3, 8, 8);
			var mount = new THREE.Mesh(mountGeom, materials.metal);
			mount.position.set(x, 2, z);
			mount.castShadow = true;
			satelliteGroup.add(mount);

			// Parabolic dish (sphere section)
			var dishGeom = new THREE.SphereGeometry(1.2, 12, 12);
			var dish = new THREE.Mesh(dishGeom, materials.copper);
			dish.scale.set(1, 0.5, 1);
			dish.position.set(x, 3, z);
			dish.rotation.x = Math.PI * 0.3;
			dish.castShadow = true;
			satelliteGroup.add(dish);
		}

		satelliteGroup.position.set(18, 0, -12);
		scene.add(satelliteGroup);
	}

	function createLightningRodCluster(scene) {
		lightningGroup = new THREE.Group();

		// Base mount
		var baseGeom = new THREE.CylinderGeometry(0.8, 1.2, 0.4, 8);
		var base = new THREE.Mesh(baseGeom, materials.copper);
		base.position.set(0, 0, 0);
		base.castShadow = true;
		lightningGroup.add(base);

		// Create 7 lightning rods in cluster
		for (var i = 0; i < 7; i++) {
			var angle = (i / 7) * Math.PI * 2;
			var offset = i === 0 ? 0 : 1.2;
			var x = Math.cos(angle) * offset;
			var z = Math.sin(angle) * offset;

			var rodGeom = new THREE.CylinderGeometry(0.08, 0.1, 3, 6);
			var rod = new THREE.Mesh(rodGeom, materials.copper);
			rod.position.set(x, 1.5, z);
			rod.castShadow = true;
			lightningGroup.add(rod);

			// Rod tip
			var tipGeom = new THREE.ConeGeometry(0.06, 0.5, 6);
			var tip = new THREE.Mesh(tipGeom, materials.copper);
			tip.position.set(x, 3.25, z);
			tip.castShadow = true;
			lightningGroup.add(tip);
		}

		lightningGroup.position.set(-8, 0, -15);
		scene.add(lightningGroup);
	}

	function createTemperatureSensorArrays(scene) {
		var sensorGroup = new THREE.Group();

		// Sensor array frame (3x3 grid on posts)
		for (var row = 0; row < 3; row++) {
			for (var col = 0; col < 3; col++) {
				var x = (col - 1) * 2;
				var z = (row - 1) * 2;

				// Post
				var postGeom = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 6);
				var post = new THREE.Mesh(postGeom, materials.metal);
				post.position.set(x, 0.75, z);
				post.castShadow = true;
				sensorGroup.add(post);

				// Sensor box
				var sensorGeom = new THREE.BoxGeometry(0.3, 0.4, 0.3);
				var sensor = new THREE.Mesh(sensorGeom, materials.plastic);
				sensor.position.set(x, 1.7, z);
				sensor.castShadow = true;
				sensorGroup.add(sensor);

				// Radiation shield (thin cylinder)
				var shieldGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8);
				var shield = new THREE.Mesh(shieldGeom, materials.rubber);
				shield.position.set(x, 2.1, z);
				sensorGroup.add(shield);
			}
		}

		sensorGroup.position.set(10, 0, -8);
		scene.add(sensorGroup);
	}

	function createSnowGauges(scene) {
		var gaugeGroup = new THREE.Group();

		// Create 5 snow gauges spread out
		for (var i = 0; i < 5; i++) {
			var angle = (i / 5) * Math.PI * 2;
			var x = Math.cos(angle) * 3;
			var z = Math.sin(angle) * 3;

			// Gauge cylinder (measurement tube)
			var tubeGeom = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
			var tube = new THREE.Mesh(tubeGeom, materials.plastic);
			tube.position.set(x, 1, z);
			tube.castShadow = true;
			gaugeGroup.add(tube);

			// Base ring
			var baseGeom = new THREE.CylinderGeometry(0.25, 0.3, 0.2, 8);
			var base = new THREE.Mesh(baseGeom, materials.rubber);
			base.position.set(x, 0.1, z);
			base.castShadow = true;
			gaugeGroup.add(base);
		}

		gaugeGroup.position.set(-12, 0, 5);
		scene.add(gaugeGroup);
	}

	function createUndergroundBunker(scene) {
		var bunkerGroup = new THREE.Group();

		// Main bunker box (partially visible)
		var bunkerGeom = new THREE.BoxGeometry(4, 2, 3);
		var bunker = new THREE.Mesh(bunkerGeom, materials.concrete);
		bunker.position.set(0, -1, 0);
		bunker.castShadow = true;
		bunkerGroup.add(bunker);

		// Entrance hatch
		var hatchGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 8);
		var hatch = new THREE.Mesh(hatchGeom, materials.metal);
		hatch.position.set(-1, 0.9, 0);
		hatch.castShadow = true;
		bunkerGroup.add(hatch);

		// Vent pipe
		var ventGeom = new THREE.CylinderGeometry(0.3, 0.35, 1.5, 6);
		var vent = new THREE.Mesh(ventGeom, materials.metal);
		vent.position.set(1.5, 0.5, 1);
		vent.castShadow = true;
		bunkerGroup.add(vent);

		bunkerGroup.position.set(-20, 0, -20);
		scene.add(bunkerGroup);
	}

	function createBalloonLaunchPad(scene) {
		balloonGroup = new THREE.Group();

		// Launch pad base
		var padGeom = new THREE.CylinderGeometry(2, 2.5, 0.5, 8);
		var pad = new THREE.Mesh(padGeom, materials.concrete);
		pad.position.set(0, 0, 0);
		pad.castShadow = true;
		balloonGroup.add(pad);

		// Tether point posts (4x)
		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var x = Math.cos(angle) * 1.5;
			var z = Math.sin(angle) * 1.5;

			var postGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6);
			var post = new THREE.Mesh(postGeom, materials.metal);
			post.position.set(x, 0.4, z);
			post.castShadow = true;
			balloonGroup.add(post);
		}

		// Weather balloon (sphere)
		var balloonGeom = new THREE.SphereGeometry(0.6, 12, 12);
		var balloon = new THREE.Mesh(balloonGeom, materials.plastic);
		balloon.position.set(0, 1, 0);
		balloon.castShadow = true;
		balloonGroup.add(balloon);

		// Instrument payload box
		var payloadGeom = new THREE.BoxGeometry(0.4, 0.3, 0.4);
		var payload = new THREE.Mesh(payloadGeom, materials.metal);
		payload.position.set(0, 0.5, 0);
		payload.castShadow = true;
		balloonGroup.add(payload);

		balloonGroup.position.set(20, 0, 5);
		scene.add(balloonGroup);
	}

	function createAntennaFarm(scene) {
		var antennaGroup = new THREE.Group();

		// Create diverse antenna types (6x)
		for (var i = 0; i < 6; i++) {
			var angle = (i / 6) * Math.PI * 2;
			var x = Math.cos(angle) * 2.5;
			var z = Math.sin(angle) * 2.5;

			// Antenna base
			var baseGeom = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 6);
			var base = new THREE.Mesh(baseGeom, materials.metal);
			base.position.set(x, 0.15, z);
			base.castShadow = true;
			antennaGroup.add(base);

			// Antenna rod
			var rodGeom = new THREE.CylinderGeometry(0.05, 0.06, 2, 4);
			var rod = new THREE.Mesh(rodGeom, materials.copper);
			rod.position.set(x, 1.3, z);
			rod.castShadow = true;
			antennaGroup.add(rod);

			// Antenna top cap
			var capGeom = new THREE.SphereGeometry(0.08, 6, 6);
			var cap = new THREE.Mesh(capGeom, materials.metal);
			cap.position.set(x, 2.3, z);
			cap.castShadow = true;
			antennaGroup.add(cap);

			// Cross element for some antennas
			if (i % 2 === 0) {
				var crossGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4);
				var cross = new THREE.Mesh(crossGeom, materials.copper);
				cross.position.set(x, 1.8, z);
				cross.rotation.z = Math.PI / 2;
				antennaGroup.add(cross);
			}
		}

		antennaGroup.position.set(8, 0, 18);
		scene.add(antennaGroup);
	}

	function createBackupWindmills(scene) {
		windmillGroup = new THREE.Group();

		// Create 2 windmills
		for (var i = 0; i < 2; i++) {
			var offsetX = (i - 0.5) * 4;

			// Windmill tower
			var towerGeom = new THREE.CylinderGeometry(0.4, 0.5, 5, 8);
			var tower = new THREE.Mesh(towerGeom, materials.metal);
			tower.position.set(offsetX, 2.5, 0);
			tower.castShadow = true;
			windmillGroup.add(tower);

			// Nacelle (generator box)
			var nacelleGeom = new THREE.BoxGeometry(0.6, 0.4, 0.4);
			var nacelle = new THREE.Mesh(nacelleGeom, materials.metal);
			nacelle.position.set(offsetX, 5, 0);
			nacelle.castShadow = true;
			windmillGroup.add(nacelle);

			// Rotor hub
			var hubGeom = new THREE.SphereGeometry(0.25, 8, 8);
			var hub = new THREE.Mesh(hubGeom, materials.metal);
			hub.position.set(offsetX, 5, 0.5);
			hub.castShadow = true;
			windmillGroup.add(hub);

			// Create 3 rotor blades using elongated boxes
			for (var j = 0; j < 3; j++) {
				var bladeAngle = (j / 3) * Math.PI * 2;
				var bladeGeom = new THREE.BoxGeometry(0.3, 2, 0.15);
				var blade = new THREE.Mesh(bladeGeom, materials.plastic);
				blade.position.set(offsetX, 5, 0.5);
				blade.rotation.z = bladeAngle;
				blade.castShadow = true;
				windmillGroup.add(blade);
			}
		}

		windmillGroup.position.set(-25, 0, 15);
		scene.add(windmillGroup);
	}

	function init(scene, camera) {
		initMaterials();

		// Create all weather station components
		createRadarDome(scene);
		createWindMast(scene);
		createSatelliteDishArray(scene);
		createLightningRodCluster(scene);
		createTemperatureSensorArrays(scene);
		createSnowGauges(scene);
		createUndergroundBunker(scene);
		createBalloonLaunchPad(scene);
		createAntennaFarm(scene);
		createBackupWindmills(scene);

		// Collect all objects for tracking
		scene.traverse(function(obj) {
			if (obj instanceof THREE.Mesh) {
				objects.push(obj);
			}
		});

		return {
			objectCount: objects.length,
			groups: {
				radar: radarGroup,
				anemometer: anemometerGroup,
				satellite: satelliteGroup,
				lightning: lightningGroup,
				balloon: balloonGroup,
				windmill: windmillGroup
			}
		};
	}

	function update(delta) {
		// Radar dome rotation
		if (radarGroup) {
			radarGroup.rotation.y += delta * 0.5;
		}

		// Anemometer rotation
		if (anemometerGroup) {
			for (var i = 0; i < anemometerGroup.children.length; i++) {
				var child = anemometerGroup.children[i];
				if (child.geometry instanceof THREE.SphereGeometry && child.position.y > 5) {
					child.parent.rotation.y += delta * 2;
					break;
				}
			}
		}

		// Satellite dish rotation
		if (satelliteGroup) {
			satelliteGroup.rotation.y += delta * 0.3;
		}

		// Lightning flash effect
		if (lightningGroup) {
			animationState.lightningFlash += delta;
			var intensity = Math.max(0, Math.sin(animationState.lightningFlash * 3) * 0.5);
			for (var i = 0; i < lightningGroup.children.length; i++) {
				var rod = lightningGroup.children[i];
				if (rod.material) {
					rod.material.emissive.setHSL(0.08, 1, intensity * 0.3);
				}
			}
			if (animationState.lightningFlash > Math.PI * 2) {
				animationState.lightningFlash = 0;
			}
		}

		// Balloon ascent
		if (balloonGroup) {
			animationState.balloonHeight += delta * 0.3;
			balloonGroup.position.y = Math.sin(animationState.balloonHeight) * 0.5;
		}

		// Windmill blade rotation
		if (windmillGroup) {
			windmillGroup.rotation.y += delta * 0.2;
		}
	}

	function reset() {
		// Reset animation state
		animationState.radarRotation = 0;
		animationState.anemometerRotation = 0;
		animationState.satelliteRotation = 0;
		animationState.lightningFlash = 0;
		animationState.balloonHeight = 0;
		animationState.windmillRotation = 0;

		// Remove all objects from groups
		if (radarGroup && radarGroup.parent) {
			radarGroup.parent.remove(radarGroup);
		}
		if (anemometerGroup && anemometerGroup.parent) {
			anemometerGroup.parent.remove(anemometerGroup);
		}
		if (satelliteGroup && satelliteGroup.parent) {
			satelliteGroup.parent.remove(satelliteGroup);
		}
		if (lightningGroup && lightningGroup.parent) {
			lightningGroup.parent.remove(lightningGroup);
		}
		if (balloonGroup && balloonGroup.parent) {
			balloonGroup.parent.remove(balloonGroup);
		}
		if (windmillGroup && windmillGroup.parent) {
			windmillGroup.parent.remove(windmillGroup);
		}

		objects = [];
		radarGroup = null;
		anemometerGroup = null;
		satelliteGroup = null;
		lightningGroup = null;
		balloonGroup = null;
		windmillGroup = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
