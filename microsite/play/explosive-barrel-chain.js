window.ExplosiveBarrelChain = (function () {
    'use strict';

    // ─── Constants ──────────────────────────────────────────────────────────────
    var CHAIN_RADIUS = 4;       // metres
    var CHAIN_DELAY  = 0.2;     // seconds between linked blasts
    var KICK_DISTANCE = 1.2;    // metres — must be this close to kick
    var KICK_FORCE   = 3;       // units barrel rolls on kick

    var BARREL_TYPES = {
        FUEL:     'FUEL',
        OIL:      'OIL',
        CHEMICAL: 'CHEMICAL',
        AMMO:     'AMMO'
    };

    var TYPE_CONFIG = {
        FUEL:     { hp: 50,  color: 0xcc1111, capColor: 0x880000, label: 'FUEL',     radius: 8,  damage: 100 },
        OIL:      { hp: 80,  color: 0x111111, capColor: 0x333333, label: 'OIL',      radius: 0,  damage: 0   },
        CHEMICAL: { hp: 80,  color: 0x22aa22, capColor: 0x116611, label: 'CHEM',     radius: 4,  damage: 30  },
        AMMO:     { hp: 80,  color: 0x8b5e3c, capColor: 0x5a3a1a, label: 'AMMO',     radius: 2,  damage: 40  }
    };

    // ─── State ───────────────────────────────────────────────────────────────────
    var barrels   = [];   // array of barrel objects
    var pending   = [];   // { barrel, timer } for delayed chain detonations
    var leakParticles = [];
    var oilSlicks = [];
    var scene     = null;
    var chainCount = 0;   // explosions in current chain wave
    var scoreMultiplierActive = false;

    // ─── Init ────────────────────────────────────────────────────────────────────
    function init(sceneRef) {
        scene = sceneRef;
        barrels = [];
        pending = [];
        leakParticles = [];
        oilSlicks = [];
        chainCount = 0;
        scoreMultiplierActive = false;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    function dist3(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function makeLabel(text, color) {
        var canvas  = document.createElement('canvas');
        canvas.width  = 128;
        canvas.height = 64;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, 128, 64);
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = color || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 32);
        var tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    function showToast(msg) {
        var div = document.createElement('div');
        div.textContent = msg;
        div.style.cssText = [
            'position:fixed',
            'top:30%',
            'left:50%',
            'transform:translateX(-50%)',
            'font-size:2em',
            'font-weight:bold',
            'color:#ffdd00',
            'text-shadow:0 0 8px #ff6600,0 2px 4px #000',
            'pointer-events:none',
            'z-index:99999',
            'transition:opacity 2s'
        ].join(';');
        document.body.appendChild(div);
        setTimeout(function () { div.style.opacity = '0'; }, 1500);
        setTimeout(function () { document.body.removeChild(div); }, 3500);
    }

    // ─── Spawn a single barrel ────────────────────────────────────────────────────
    function spawn(sceneRef, x, y, z, type) {
        var sc = sceneRef || scene;
        if (!sc) { return null; }
        var cfg = TYPE_CONFIG[type] || TYPE_CONFIG.FUEL;

        // Body
        var geo    = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
        var mat    = new THREE.MeshLambertMaterial({ color: cfg.color });
        var mesh   = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + 0.4, z);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;

        // Cap top
        var capGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.06, 16);
        var capMat = new THREE.MeshLambertMaterial({ color: cfg.capColor });
        var cap    = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.43;
        mesh.add(cap);

        // AMMO: green stripe
        if (type === BARREL_TYPES.AMMO) {
            var stripeGeo = new THREE.CylinderGeometry(0.305, 0.305, 0.12, 16);
            var stripeMat = new THREE.MeshLambertMaterial({ color: 0x22aa22 });
            var stripe    = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.y = 0.1;
            mesh.add(stripe);
        }

        // Label decal — a plane on the front face
        var labelTex   = makeLabel(cfg.label, type === BARREL_TYPES.CHEMICAL ? '#00ff66' : '#ffffff');
        var labelGeo   = new THREE.PlaneGeometry(0.5, 0.25);
        var labelMat   = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false });
        var labelMesh  = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, 0, 0.305);
        mesh.add(labelMesh);

        sc.add(mesh);

        var barrel = {
            mesh:      mesh,
            type:      type || BARREL_TYPES.FUEL,
            hp:        cfg.hp,
            maxHp:     cfg.hp,
            exploded:  false,
            scene:     sc,
            velocity:  new THREE.Vector3(0, 0, 0),
            rolling:   false,
            rollTimer: 0
        };

        barrels.push(barrel);
        return barrel;
    }

    // ─── Spawn barrels for a level ───────────────────────────────────────────────
    function spawnForLevel(sceneRef, count) {
        var sc = sceneRef || scene;
        var n  = Math.min(Math.max(count || 5, 3), 8);
        var types = [BARREL_TYPES.FUEL, BARREL_TYPES.OIL, BARREL_TYPES.CHEMICAL, BARREL_TYPES.AMMO];
        for (var i = 0; i < n; i++) {
            var x = (Math.random() - 0.5) * 40;
            var z = (Math.random() - 0.5) * 40;
            var t = types[Math.floor(Math.random() * types.length)];
            spawn(sc, x, 0, z, t);
        }
    }

    // ─── Damage a barrel (e.g. from bullet hit) ───────────────────────────────────
    function damageBarrel(barrel, amount) {
        if (barrel.exploded) { return; }
        barrel.hp -= amount;
        if (barrel.hp <= 0) {
            explode(barrel, 0, 0);
        }
    }

    // ─── Chain reaction ───────────────────────────────────────────────────────────
    function triggerChain(sourceBarrel, depth) {
        var pos = sourceBarrel.mesh.position;
        for (var i = 0; i < barrels.length; i++) {
            var b = barrels[i];
            if (b === sourceBarrel || b.exploded) { continue; }
            // check if already scheduled
            var alreadyPending = false;
            for (var p = 0; p < pending.length; p++) {
                if (pending[p].barrel === b) { alreadyPending = true; break; }
            }
            if (alreadyPending) { continue; }
            var d = dist3(b.mesh.position, pos);
            if (d <= CHAIN_RADIUS) {
                pending.push({ barrel: b, timer: CHAIN_DELAY * (depth + 1) });
            }
        }
    }

    // ─── Score / chain bonus ──────────────────────────────────────────────────────
    function announceChainBonus(count) {
        showToast('+CHAIN ×' + count + ' BONUS');
        scoreMultiplierActive = true;
        // wire into existing score system if available
        if (window.ComboSystem && ComboSystem.addMultiplier) {
            ComboSystem.addMultiplier(count);
        }
        setTimeout(function () { scoreMultiplierActive = false; }, 5000);
    }

    // ─── FUEL explosion: massive fireball ────────────────────────────────────────
    function doFuelExplosion(barrel) {
        var pos  = barrel.mesh.position;
        var cfg  = TYPE_CONFIG.FUEL;

        // Damage nearby entities
        applyAreaDamage(pos, cfg.radius, cfg.damage, barrel);

        // Fireball flash mesh
        var fbGeo = new THREE.SphereGeometry(2.5, 12, 12);
        var fbMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 });
        var fb    = new THREE.Mesh(fbGeo, fbMat);
        fb.position.copy(pos);
        barrel.scene.add(fb);

        // PointLight flicker for 5 s
        var light = new THREE.PointLight(0xff4400, 4, 12);
        light.position.copy(pos);
        barrel.scene.add(light);

        var elapsed = 0;
        var flickerFn = setInterval(function () {
            elapsed += 0.1;
            light.intensity = 2 + Math.random() * 3;
            fb.material.opacity = Math.max(0, 0.85 - elapsed / 5);
            fb.scale.setScalar(1 + elapsed * 0.3 + Math.random() * 0.2);
            if (elapsed >= 5) {
                clearInterval(flickerFn);
                barrel.scene.remove(light);
                barrel.scene.remove(fb);
                fb.geometry.dispose();
                fb.material.dispose();
            }
        }, 100);
    }

    // ─── OIL explosion: oil slick plane ──────────────────────────────────────────
    function doOilExplosion(barrel) {
        var pos = barrel.mesh.position;

        // Create oil slick plane
        var slickGeo = new THREE.CircleGeometry(3, 24);
        var slickMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide
        });
        var slick = new THREE.Mesh(slickGeo, slickMat);
        slick.rotation.x = -Math.PI / 2;
        slick.position.set(pos.x, pos.y - 0.39, pos.z);
        barrel.scene.add(slick);
        oilSlicks.push({ mesh: slick, radius: 3, center: slick.position.clone() });

        // Smoke puff
        spawnSmokePuff(barrel.scene, pos, 0x222222, 1.5, 2);
    }

    // ─── CHEMICAL explosion: gas cloud ───────────────────────────────────────────
    function doChemicalExplosion(barrel) {
        var pos = barrel.mesh.position;

        // Delegate to ChemicalWarfare if available
        if (window.ChemicalWarfare && ChemicalWarfare.spawnGasCloud) {
            ChemicalWarfare.spawnGasCloud(barrel.scene, pos.x, pos.y, pos.z, 4, 8, 30);
        } else {
            // Fallback: basic green cloud visual + damage over time
            var cloudGeo = new THREE.SphereGeometry(2, 10, 10);
            var cloudMat = new THREE.MeshBasicMaterial({ color: 0x44dd44, transparent: true, opacity: 0.4 });
            var cloud    = new THREE.Mesh(cloudGeo, cloudMat);
            cloud.position.copy(pos);
            cloud.position.y += 0.5;
            barrel.scene.add(cloud);

            var ticks  = 0;
            var maxTicks = 80; // 8 s at 10fps ticks
            var cloudInterval = setInterval(function () {
                ticks++;
                cloud.material.opacity = 0.4 * (1 - ticks / maxTicks);
                cloud.scale.setScalar(1 + ticks * 0.02);
                // dot damage
                applyAreaDamage(pos, 4, 3, barrel); // 30/s at 10Hz = 3/tick
                if (ticks >= maxTicks) {
                    clearInterval(cloudInterval);
                    barrel.scene.remove(cloud);
                    cloud.geometry.dispose();
                    cloud.material.dispose();
                }
            }, 100);
        }
    }

    // ─── AMMO explosion: 6 mini-blasts ───────────────────────────────────────────
    function doAmmoExplosion(barrel) {
        var pos = barrel.mesh.position;
        var sc  = barrel.scene;

        for (var i = 0; i < 6; i++) {
            (function (idx) {
                var delay = idx * 120 + Math.random() * 80;
                setTimeout(function () {
                    var angle  = Math.random() * Math.PI * 2;
                    var spread = Math.random() * 2.5;
                    var bx = pos.x + Math.cos(angle) * spread;
                    var bz = pos.z + Math.sin(angle) * spread;
                    var bPos = new THREE.Vector3(bx, pos.y, bz);

                    applyAreaDamage(bPos, 2, 40, barrel);

                    // Mini flash
                    var mGeo = new THREE.SphereGeometry(0.6, 8, 8);
                    var mMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9 });
                    var mini = new THREE.Mesh(mGeo, mMat);
                    mini.position.copy(bPos);
                    sc.add(mini);
                    var ft = 0;
                    var fi = setInterval(function () {
                        ft += 0.08;
                        mini.material.opacity = Math.max(0, 0.9 - ft);
                        mini.scale.setScalar(1 + ft * 2);
                        if (ft >= 1) {
                            clearInterval(fi);
                            sc.remove(mini);
                            mini.geometry.dispose();
                            mini.material.dispose();
                        }
                    }, 80);
                }, delay);
            })(i);
        }
    }

    // ─── Generic area damage ──────────────────────────────────────────────────────
    function applyAreaDamage(pos, radius, dmg, sourceBarrel) {
        // Damage player if GameManager / health system exists
        if (window.GameManager && GameManager.getPlayerPosition) {
            var pp = GameManager.getPlayerPosition();
            if (pp) {
                var pd = dist3(pp, pos);
                if (pd <= radius) {
                    var falloff = 1 - pd / radius;
                    var actualDmg = Math.round(dmg * falloff);
                    if (actualDmg > 0 && GameManager.damagePlayer) {
                        GameManager.damagePlayer(actualDmg);
                    }
                }
            }
        }
        // Damage enemies if EnemyManager exists
        if (window.EnemyManager && EnemyManager.getEnemies) {
            var enemies = EnemyManager.getEnemies();
            for (var i = 0; i < enemies.length; i++) {
                var e = enemies[i];
                var ep = e.position || (e.mesh && e.mesh.position);
                if (!ep) { continue; }
                var ed = dist3(ep, pos);
                if (ed <= radius) {
                    var eFalloff = 1 - ed / radius;
                    var eDmg = Math.round(dmg * eFalloff);
                    if (eDmg > 0) {
                        if (e.takeDamage) { e.takeDamage(eDmg); }
                        else if (EnemyManager.damageEnemy) { EnemyManager.damageEnemy(e, eDmg); }
                        if (scoreMultiplierActive && window.GameManager && GameManager.addScore) {
                            GameManager.addScore(100 * 3);
                        } else if (window.GameManager && GameManager.addScore) {
                            GameManager.addScore(100);
                        }
                    }
                }
            }
        }
    }

    // ─── Smoke puff helper ────────────────────────────────────────────────────────
    function spawnSmokePuff(sc, pos, color, size, duration) {
        var sGeo = new THREE.SphereGeometry(size * 0.5, 8, 8);
        var sMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
        var smoke = new THREE.Mesh(sGeo, sMat);
        smoke.position.copy(pos);
        smoke.position.y += 0.3;
        sc.add(smoke);
        var t = 0;
        var si = setInterval(function () {
            t += 0.1;
            smoke.material.opacity = Math.max(0, 0.6 - t / duration);
            smoke.scale.setScalar(1 + t * 1.5);
            smoke.position.y += 0.04;
            if (t >= duration) {
                clearInterval(si);
                sc.remove(smoke);
                smoke.geometry.dispose();
                smoke.material.dispose();
            }
        }, 100);
    }

    // ─── Main explode ─────────────────────────────────────────────────────────────
    function explode(barrel, chainDepth, waveIndex) {
        if (barrel.exploded) { return; }
        barrel.exploded = true;
        chainCount++;

        var sc  = barrel.scene || scene;
        var pos = barrel.mesh.position;

        // Remove barrel mesh
        sc.remove(barrel.mesh);
        if (barrel.mesh.geometry) { barrel.mesh.geometry.dispose(); }

        // Remove any leak particles belonging to this barrel
        for (var lp = leakParticles.length - 1; lp >= 0; lp--) {
            var lobj = leakParticles[lp];
            if (lobj.barrel === barrel) {
                sc.remove(lobj.mesh);
                lobj.mesh.geometry.dispose();
                leakParticles.splice(lp, 1);
            }
        }

        // Type-specific effect
        switch (barrel.type) {
            case BARREL_TYPES.FUEL:     doFuelExplosion(barrel);     break;
            case BARREL_TYPES.OIL:      doOilExplosion(barrel);      break;
            case BARREL_TYPES.CHEMICAL: doChemicalExplosion(barrel); break;
            case BARREL_TYPES.AMMO:     doAmmoExplosion(barrel);     break;
            default:                    doFuelExplosion(barrel);     break;
        }

        // Generic explosion debris flash for all types except OIL
        if (barrel.type !== BARREL_TYPES.OIL) {
            spawnSmokePuff(sc, pos, 0x444444, 1.2, 1.5);
        }

        // Chain trigger
        triggerChain(barrel, chainDepth || 0);

        // Check chain bonus (3+ barrels)
        if (chainCount >= 3 && !scoreMultiplierActive) {
            announceChainBonus(chainCount);
        }
    }

    // ─── Barrel hit (bullet damage) ───────────────────────────────────────────────
    function hitBarrel(barrel, damage) {
        damageBarrel(barrel, damage || 20);
    }

    // ─── Leak particles ───────────────────────────────────────────────────────────
    function spawnLeakDrop(barrel) {
        var sc   = barrel.scene || scene;
        var cfg  = TYPE_CONFIG[barrel.type] || TYPE_CONFIG.FUEL;
        var isChemical = barrel.type === BARREL_TYPES.CHEMICAL;
        var isOil      = barrel.type === BARREL_TYPES.OIL;

        var color = isChemical ? 0x44ff44 : (isOil ? 0x111111 : 0xcc1111);

        var dGeo  = new THREE.SphereGeometry(0.04, 5, 5);
        var dMat  = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
        var drop  = new THREE.Mesh(dGeo, dMat);

        var bpos  = barrel.mesh.position;
        drop.position.set(
            bpos.x + (Math.random() - 0.5) * 0.3,
            bpos.y + 0.3,
            bpos.z + (Math.random() - 0.5) * 0.3
        );
        sc.add(drop);

        var velY = -0.04 - Math.random() * 0.03;
        leakParticles.push({
            barrel: barrel,
            mesh: drop,
            vel: velY,
            life: 0,
            maxLife: 1.5 + Math.random()
        });

        // For chemical: also add a faint upward vapor puff
        if (isChemical) {
            var vGeo = new THREE.SphereGeometry(0.08, 5, 5);
            var vMat = new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: 0.3 });
            var vap  = new THREE.Mesh(vGeo, vMat);
            vap.position.copy(drop.position);
            sc.add(vap);
            leakParticles.push({
                barrel: barrel,
                mesh: vap,
                vel: 0.05,
                life: 0,
                maxLife: 1.0
            });
        }
    }

    // ─── Kick barrel (player presses F when adjacent) ────────────────────────────
    function kickBarrel(playerPos, playerDirection) {
        if (!playerPos) { return; }
        for (var i = 0; i < barrels.length; i++) {
            var b = barrels[i];
            if (b.exploded) { continue; }
            var d = dist3(b.mesh.position, playerPos);
            if (d <= KICK_DISTANCE) {
                b.velocity.copy(playerDirection).multiplyScalar(KICK_FORCE);
                b.rolling   = true;
                b.rollTimer = 0;
                break;
            }
        }
    }

    // ─── Check if player is on oil slick ─────────────────────────────────────────
    function isOnOilSlick(playerPos) {
        for (var i = 0; i < oilSlicks.length; i++) {
            var sl = oilSlicks[i];
            var dx = playerPos.x - sl.center.x;
            var dz = playerPos.z - sl.center.z;
            if (Math.sqrt(dx * dx + dz * dz) <= sl.radius) {
                return true;
            }
        }
        return false;
    }

    // ─── Update (call from game loop, dt in seconds) ──────────────────────────────
    function update(dt) {
        var i, b, lp;

        // Process pending chain detonations
        for (i = pending.length - 1; i >= 0; i--) {
            pending[i].timer -= dt;
            if (pending[i].timer <= 0) {
                var pb = pending[i].barrel;
                pending.splice(i, 1);
                explode(pb, 1, 0);
            }
        }

        // Rolling barrels
        for (i = 0; i < barrels.length; i++) {
            b = barrels[i];
            if (!b.rolling || b.exploded) { continue; }
            b.rollTimer += dt;
            if (b.rollTimer > 1.0) {
                b.rolling = false;
                b.velocity.set(0, 0, 0);
                continue;
            }
            var friction = 0.85;
            b.velocity.multiplyScalar(friction);
            b.mesh.position.addScaledVector(b.velocity, dt);
            // visual roll rotation
            b.mesh.rotation.z += b.velocity.length() * dt * 2;
        }

        // Leak particles
        for (lp = leakParticles.length - 1; lp >= 0; lp--) {
            var lobj = leakParticles[lp];
            lobj.life += dt;
            lobj.mesh.position.y += lobj.vel;
            lobj.mesh.material.opacity = Math.max(0, 0.8 * (1 - lobj.life / lobj.maxLife));
            if (lobj.life >= lobj.maxLife) {
                var sc2 = (lobj.barrel && lobj.barrel.scene) ? lobj.barrel.scene : scene;
                if (sc2) { sc2.remove(lobj.mesh); }
                lobj.mesh.geometry.dispose();
                lobj.mesh.material.dispose();
                leakParticles.splice(lp, 1);
            }
        }

        // Spawn leak drops for damaged barrels below 30% HP
        for (i = 0; i < barrels.length; i++) {
            b = barrels[i];
            if (b.exploded) { continue; }
            var hpRatio = b.hp / b.maxHp;
            if (hpRatio < 0.3) {
                // Drip every ~0.3s on average
                if (Math.random() < dt * 3.5) {
                    spawnLeakDrop(b);
                }
            }
        }
    }

    // ─── Reset ────────────────────────────────────────────────────────────────────
    function reset() {
        var i;
        for (i = 0; i < barrels.length; i++) {
            var b = barrels[i];
            if (!b.exploded && b.scene) {
                b.scene.remove(b.mesh);
                if (b.mesh.geometry) { b.mesh.geometry.dispose(); }
            }
        }
        for (i = 0; i < leakParticles.length; i++) {
            var lp = leakParticles[i];
            var sc3 = (lp.barrel && lp.barrel.scene) ? lp.barrel.scene : scene;
            if (sc3) { sc3.remove(lp.mesh); }
            lp.mesh.geometry.dispose();
            lp.mesh.material.dispose();
        }
        for (i = 0; i < oilSlicks.length; i++) {
            var sl = oilSlicks[i];
            if (scene) { scene.remove(sl.mesh); }
            sl.mesh.geometry.dispose();
            sl.mesh.material.dispose();
        }
        barrels       = [];
        pending       = [];
        leakParticles = [];
        oilSlicks     = [];
        chainCount    = 0;
        scoreMultiplierActive = false;
    }

    // ─── Public API ───────────────────────────────────────────────────────────────
    return {
        init:          init,
        update:        update,
        spawn:         spawn,
        spawnForLevel: spawnForLevel,
        explode:       explode,
        reset:         reset,
        hitBarrel:     hitBarrel,
        kickBarrel:    kickBarrel,
        isOnOilSlick:  isOnOilSlick,
        TYPES:         BARREL_TYPES
    };
})();
