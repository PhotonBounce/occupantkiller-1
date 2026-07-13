window.BulletCam = (function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    var active = false;
    var phase = 'idle'; // 'travel' | 'impact' | 'orbit' | 'pan' | 'idle'

    var bulletPos = { x: 0, y: 0, z: 0 };
    var bulletDir = { x: 0, y: 0, z: 0 };
    var targetPos = { x: 0, y: 0, z: 0 };
    var targetMesh = null;
    var killerPos = { x: 0, y: 0, z: 0 };

    var camPos = { x: 0, y: 0, z: 0 };
    var camTarget = { x: 0, y: 0, z: 0 };

    var phaseTimer = 0;
    var totalTimer = 0;
    var MAX_DURATION = 5.0;

    var orbitAngle = 0;
    var orbitRadius = 4;

    var consecutiveNoKillCam = 0;
    var FORCE_THRESHOLD = 3;

    var BULLET_SPEED = 18; // m/s cinematic

    // DOM overlay elements
    var overlayContainer = null;
    var letterboxTop = null;
    var letterboxBottom = null;
    var watermark = null;
    var eliminationText = null;
    var flashOverlay = null;

    var flashTimer = 0;
    var FLASH_DURATION = 0.1;

    var elimScale = 1.0;
    var elimScaleTarget = 2.2;
    var elimVisible = false;

    var wobbleTime = 0;

    // ─── Math helpers ─────────────────────────────────────────────────────────
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function lerpVec3(out, a, b, t) {
        out.x = lerp(a.x, b.x, t);
        out.y = lerp(a.y, b.y, t);
        out.z = lerp(a.z, b.z, t);
    }

    function vecLen(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    function vecNorm(v) {
        var l = vecLen(v);
        if (l < 0.0001) return { x: 0, y: 0, z: 0 };
        return { x: v.x / l, y: v.y / l, z: v.z / l };
    }

    function vecDist(a, b) {
        var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function copyVec(dst, src) {
        dst.x = src.x;
        dst.y = src.y;
        dst.z = src.z;
    }

    // ─── DOM overlay creation ─────────────────────────────────────────────────
    function createOverlays() {
        if (overlayContainer) return;

        overlayContainer = document.createElement('div');
        overlayContainer.id = 'bulletcam-overlay';
        overlayContainer.style.cssText = [
            'position:fixed',
            'top:0', 'left:0', 'width:100%', 'height:100%',
            'pointer-events:none',
            'z-index:9000',
            'display:none'
        ].join(';');

        // Letterbox top
        letterboxTop = document.createElement('div');
        letterboxTop.style.cssText = [
            'position:absolute',
            'top:0', 'left:0', 'width:100%', 'height:8%',
            'background:#000'
        ].join(';');

        // Letterbox bottom
        letterboxBottom = document.createElement('div');
        letterboxBottom.style.cssText = [
            'position:absolute',
            'bottom:0', 'left:0', 'width:100%', 'height:8%',
            'background:#000'
        ].join(';');

        // Film grain filter applied to a pseudo-element via a filter div
        var grainDiv = document.createElement('div');
        grainDiv.style.cssText = [
            'position:absolute',
            'top:8%', 'left:0', 'width:100%', 'height:84%',
            'pointer-events:none',
            'opacity:0.04',
            'background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
            'background-size:150px 150px'
        ].join(';');

        // "BULL CAM" watermark
        watermark = document.createElement('div');
        watermark.textContent = 'BULL CAM';
        watermark.style.cssText = [
            'position:absolute',
            'bottom:10%', 'right:1.5%',
            'color:rgba(180,180,180,0.45)',
            'font-family:monospace',
            'font-size:13px',
            'letter-spacing:3px',
            'text-transform:uppercase',
            'user-select:none'
        ].join(';');

        // "ELIMINATION" text
        eliminationText = document.createElement('div');
        eliminationText.textContent = 'ELIMINATION';
        eliminationText.style.cssText = [
            'position:absolute',
            'top:50%', 'left:50%',
            'transform:translate(-50%,-50%) scale(1)',
            'color:#FFD700',
            'font-family:\'Arial Black\',Arial,sans-serif',
            'font-size:52px',
            'font-weight:900',
            'letter-spacing:8px',
            'text-shadow:0 0 30px #FF8C00, 0 0 60px #FF4500',
            'user-select:none',
            'display:none',
            'white-space:nowrap'
        ].join(';');

        // White flash overlay
        flashOverlay = document.createElement('div');
        flashOverlay.style.cssText = [
            'position:absolute',
            'top:0', 'left:0', 'width:100%', 'height:100%',
            'background:#fff',
            'opacity:0',
            'pointer-events:none'
        ].join(';');

        overlayContainer.appendChild(letterboxTop);
        overlayContainer.appendChild(letterboxBottom);
        overlayContainer.appendChild(grainDiv);
        overlayContainer.appendChild(watermark);
        overlayContainer.appendChild(eliminationText);
        overlayContainer.appendChild(flashOverlay);

        document.body.appendChild(overlayContainer);
    }

    function showOverlays() {
        if (!overlayContainer) createOverlays();
        overlayContainer.style.display = 'block';
        eliminationText.style.display = 'none';
        flashOverlay.style.opacity = '0';
    }

    function hideOverlays() {
        if (!overlayContainer) return;
        overlayContainer.style.display = 'none';
        eliminationText.style.display = 'none';
        flashOverlay.style.opacity = '0';
    }

    function triggerFlash() {
        flashTimer = FLASH_DURATION;
        if (flashOverlay) flashOverlay.style.opacity = '1';
    }

    function showElimination() {
        if (!eliminationText) return;
        elimVisible = true;
        elimScale = 0.4;
        eliminationText.style.display = 'block';
        eliminationText.style.transform = 'translate(-50%,-50%) scale(0.4)';
        eliminationText.style.opacity = '1';
    }

    function hideElimination() {
        elimVisible = false;
        if (eliminationText) eliminationText.style.display = 'none';
    }

    // ─── Three.js camera helpers ──────────────────────────────────────────────
    function getThreeCamera() {
        // Try common global names used in FPS Three.js games
        if (typeof window.camera !== 'undefined' && window.camera) return window.camera;
        if (typeof window.Camera !== 'undefined' && window.Camera) return window.Camera;
        if (typeof window._camera !== 'undefined' && window._camera) return window._camera;
        return null;
    }

    function getPlayerPos() {
        // Try common player position sources
        if (typeof window.player !== 'undefined' && window.player) {
            if (window.player.position) return window.player.position;
            if (window.player.mesh && window.player.mesh.position) return window.player.mesh.position;
        }
        if (typeof window.playerMesh !== 'undefined' && window.playerMesh && window.playerMesh.position) {
            return window.playerMesh.position;
        }
        return null;
    }

    function setCameraPos(x, y, z) {
        var cam = getThreeCamera();
        if (!cam) return;
        cam.position.set(x, y, z);
    }

    function setCameraLookAt(x, y, z) {
        var cam = getThreeCamera();
        if (!cam) return;
        if (typeof cam.lookAt === 'function') {
            cam.lookAt(x, y, z);
        }
    }

    // ─── Core activation ──────────────────────────────────────────────────────
    function shouldActivate() {
        // After 3 consecutive kills without cam, force cam on 4th
        if (consecutiveNoKillCam >= FORCE_THRESHOLD) {
            return true;
        }
        return Math.random() < 0.30;
    }

    function activateBulletCam(bulletOrigin, tgtPos, tgtMesh) {
        active = true;
        phase = 'travel';
        totalTimer = 0;
        phaseTimer = 0;
        flashTimer = 0;
        wobbleTime = 0;
        consecutiveNoKillCam = 0;
        elimVisible = false;

        // Copy positions
        copyVec(bulletPos, bulletOrigin);
        copyVec(targetPos, tgtPos);
        targetMesh = tgtMesh || null;

        // Compute direction
        var rawDir = {
            x: tgtPos.x - bulletOrigin.x,
            y: tgtPos.y - bulletOrigin.y,
            z: tgtPos.z - bulletOrigin.z
        };
        bulletDir = vecNorm(rawDir);

        // Snap initial cam position to behind bullet
        camPos.x = bulletPos.x - bulletDir.x * 3;
        camPos.y = bulletPos.y + 1;
        camPos.z = bulletPos.z - bulletDir.z * 3;

        camTarget.x = bulletPos.x;
        camTarget.y = bulletPos.y;
        camTarget.z = bulletPos.z;

        // Store killer position for pan-back
        var pp = getPlayerPos();
        if (pp) {
            killerPos.x = pp.x;
            killerPos.y = pp.y + 1.6;
            killerPos.z = pp.z;
        } else {
            // Fallback: behind bullet origin
            killerPos.x = bulletOrigin.x;
            killerPos.y = bulletOrigin.y + 1.6;
            killerPos.z = bulletOrigin.z;
        }

        // Orbit starts at angle behind target (relative to travel dir)
        orbitAngle = Math.atan2(-bulletDir.x, -bulletDir.z);

        // Time slow
        window._bulletTimeScale = 0.12;

        // Show overlays
        showOverlays();

        // Escape key to bail out early
        document.addEventListener('keydown', _onEscapeKey);
    }

    function _onEscapeKey(e) {
        if (e.key === 'Escape' && active) {
            deactivateBulletCam();
        }
    }

    function deactivateBulletCam() {
        active = false;
        phase = 'idle';
        targetMesh = null;
        window._bulletTimeScale = 1.0;
        hideOverlays();
        hideElimination();
        document.removeEventListener('keydown', _onEscapeKey);
    }

    // ─── Phase handlers ───────────────────────────────────────────────────────
    function updateTravel(dt) {
        // Advance bullet along direction
        var step = BULLET_SPEED * dt;
        bulletPos.x += bulletDir.x * step;
        bulletPos.y += bulletDir.y * step;
        bulletPos.z += bulletDir.z * step;

        // Camera trails 3m behind, 1m above
        var desiredCam = {
            x: bulletPos.x - bulletDir.x * 3,
            y: bulletPos.y + 1,
            z: bulletPos.z - bulletDir.z * 3
        };
        camPos.x = lerp(camPos.x, desiredCam.x, dt * 4);
        camPos.y = lerp(camPos.y, desiredCam.y, dt * 4);
        camPos.z = lerp(camPos.z, desiredCam.z, dt * 4);

        setCameraPos(camPos.x, camPos.y, camPos.z);
        setCameraLookAt(bulletPos.x, bulletPos.y, bulletPos.z);

        // Check impact proximity
        var dist = vecDist(bulletPos, targetPos);
        if (dist < 0.5) {
            // Arrived — trigger impact
            triggerFlash();
            showElimination();
            phase = 'orbit';
            phaseTimer = 0;
            orbitAngle = Math.atan2(-(bulletPos.x - targetPos.x), -(bulletPos.z - targetPos.z));
        }
    }

    function updateOrbit(dt) {
        phaseTimer += dt;
        var orbitProgress = Math.min(phaseTimer / 1.5, 1.0); // 1.5s orbit

        // Orbit 180 degrees around target
        orbitAngle += (Math.PI / 1.5) * dt;

        var cx = targetPos.x + Math.sin(orbitAngle) * orbitRadius;
        var cy = targetPos.y + 1.8;
        var cz = targetPos.z + Math.cos(orbitAngle) * orbitRadius;

        camPos.x = lerp(camPos.x, cx, dt * 3);
        camPos.y = lerp(camPos.y, cy, dt * 3);
        camPos.z = lerp(camPos.z, cz, dt * 3);

        setCameraPos(camPos.x, camPos.y, camPos.z);
        setCameraLookAt(targetPos.x, targetPos.y + 0.5, targetPos.z);

        // Wobble target mesh
        if (targetMesh) {
            wobbleTime += dt;
            targetMesh.rotation.z = Math.sin(wobbleTime * 12) * 0.3;
            targetMesh.rotation.x = Math.sin(wobbleTime * 9 + 1) * 0.1;
        }

        // Animate elimination scale-up
        if (elimVisible && eliminationText) {
            elimScale = lerp(elimScale, elimScaleTarget, dt * 5);
            eliminationText.style.transform = 'translate(-50%,-50%) scale(' + elimScale.toFixed(3) + ')';
        }

        if (orbitProgress >= 1.0) {
            phase = 'pan';
            phaseTimer = 0;
        }
    }

    function updatePan(dt) {
        phaseTimer += dt;
        var panProgress = Math.min(phaseTimer / 1.2, 1.0); // 1.2s pan

        // Smooth pan toward killer position
        camPos.x = lerp(camPos.x, killerPos.x, dt * 2.5);
        camPos.y = lerp(camPos.y, killerPos.y + 2, dt * 2.5);
        camPos.z = lerp(camPos.z, killerPos.z + 4, dt * 2.5);

        setCameraPos(camPos.x, camPos.y, camPos.z);
        setCameraLookAt(killerPos.x, killerPos.y, killerPos.z);

        if (panProgress >= 1.0) {
            deactivateBulletCam();
        }
    }

    function updateFlash(dt) {
        if (flashTimer <= 0) return;
        flashTimer -= dt;
        if (flashTimer <= 0) {
            flashTimer = 0;
            if (flashOverlay) flashOverlay.style.opacity = '0';
        } else {
            var alpha = flashTimer / FLASH_DURATION;
            if (flashOverlay) flashOverlay.style.opacity = alpha.toFixed(3);
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────
    function init() {
        createOverlays();
        consecutiveNoKillCam = 0;
        active = false;
        phase = 'idle';
        window._bulletTimeScale = window._bulletTimeScale || 1.0;
    }

    function update(dt) {
        if (!active) return;

        // Guard: max total duration
        totalTimer += dt;
        if (totalTimer >= MAX_DURATION) {
            deactivateBulletCam();
            return;
        }

        // Always update flash regardless of phase
        updateFlash(dt);

        if (phase === 'travel') {
            updateTravel(dt);
        } else if (phase === 'orbit') {
            updateOrbit(dt);
        } else if (phase === 'pan') {
            updatePan(dt);
        }
    }

    function onKillShot(bulletOrigin, tgtPos, tgtMesh) {
        // Don't stack bullet cams
        if (active) {
            consecutiveNoKillCam = 0;
            return;
        }

        if (shouldActivate()) {
            activateBulletCam(bulletOrigin, tgtPos, tgtMesh);
        } else {
            consecutiveNoKillCam++;
        }
    }

    function reset() {
        deactivateBulletCam();
        consecutiveNoKillCam = 0;
        window._bulletTimeScale = 1.0;
    }

    return {
        init: init,
        update: update,
        onKillShot: onKillShot,
        reset: reset
    };
})();
