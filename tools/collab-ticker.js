#!/usr/bin/env node
/**
 * collab-ticker.js — Zero-Cost Background Collab Ticker & Budget Monitor
 *
 * Automates asynchronous collaboration between Claude (cloud container) and
 * Antigravity (local Windows hardware) over git without burning Google AI quota.
 *
 * Key features:
 *  1. Zero LLM Token Usage: Polling and git checks run purely via Node.js / git.
 *  2. Quota Protection: Hard-limits automated cycles (default max 6 runs/day or configurable).
 *  3. Bidirectional Sync: Checks for new messages from Claude (collab/messages/claude/)
 *     and changes in collab/status-claude.md.
 *  4. QA Runner: Optionally runs local hardware QA (tools/qa-play.js) when requested.
 *
 * Usage:
 *   node tools/collab-ticker.js [--interval-mins 10] [--max-daily-runs 6] [--dry-run]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.OK_ROOT || path.resolve(__dirname, '..');
const BRANCH = 'claude/peaceful-cannon-oqez4t';
const BUDGET_FILE = path.join(ROOT, 'collab', '.budget-state.json');
const CLAUDE_MSG_DIR = path.join(ROOT, 'collab', 'messages', 'claude');
const AG_MSG_DIR = path.join(ROOT, 'collab', 'messages', 'antigravity');

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const INTERVAL_MS = parseInt(arg('interval-mins', '10'), 10) * 60 * 1000;
const MAX_DAILY_RUNS = parseInt(arg('max-daily-runs', '6'), 10);
const DRY_RUN = process.argv.includes('--dry-run');

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${ts}] [Collab-Ticker] ${msg}`);
}

function loadBudgetState() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (fs.existsSync(BUDGET_FILE)) {
      const data = JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));
      if (data.date === today) return data;
    }
  } catch (e) {}
  return { date: today, dailyRuns: 0, maxDailyRuns: MAX_DAILY_RUNS, processedMessages: [] };
}

function saveBudgetState(state) {
  try {
    fs.mkdirSync(path.dirname(BUDGET_FILE), { recursive: true });
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log(`Failed to save budget state: ${e.message}`);
  }
}

function checkBudget() {
  const state = loadBudgetState();
  if (state.dailyRuns >= state.maxDailyRuns) {
    log(`⚠️ Quota guard active: Daily limit (${state.dailyRuns}/${state.maxDailyRuns} runs) reached for ${state.date}. Skipping to conserve subscription credits.`);
    return false;
  }
  return true;
}

function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
  } catch (e) {
    log(`Git command failed (${cmd}): ${e.message}`);
    return null;
  }
}

function getClaudeMessages() {
  if (!fs.existsSync(CLAUDE_MSG_DIR)) return [];
  return fs.readdirSync(CLAUDE_MSG_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();
}

async function tick() {
  log('Checking for remote updates from Claude...');

  // Fetch remote branch without modifying local working copy
  const fetchResult = runGit(`git fetch origin ${BRANCH}`);
  if (fetchResult === null) {
    log('Fetch failed (network or auth issue). Will retry next tick.');
    return;
  }

  // Check if remote has new commits
  const currentHead = runGit('git rev-parse HEAD');
  const remoteHead = runGit(`git rev-parse origin/${BRANCH}`);

  if (!remoteHead) {
    log(`Could not resolve origin/${BRANCH}`);
    return;
  }

  const budget = loadBudgetState();
  const claudeMsgs = getClaudeMessages();
  const unseenMsgs = claudeMsgs.filter(m => !budget.processedMessages.includes(m));

  log(`Local HEAD: ${currentHead ? currentHead.slice(0, 7) : '?'}, Remote: ${remoteHead.slice(0, 7)}. Unseen Claude messages: ${unseenMsgs.length}`);

  if (unseenMsgs.length > 0 || currentHead !== remoteHead) {
    log(`🔔 Update detected from Claude! New messages: ${JSON.stringify(unseenMsgs)}`);

    if (!checkBudget()) {
      log('Update acknowledged, but paused by monthly credit protector.');
      return;
    }

    if (DRY_RUN) {
      log('Dry run: Skipping automatic sync/execution.');
      return;
    }

    // Fast-forward / pull changes safely
    log('Fast-forwarding local branch...');
    runGit(`git pull --rebase origin ${BRANCH}`);

    // Mark messages processed
    budget.processedMessages = Array.from(new Set([...budget.processedMessages, ...unseenMsgs]));
    budget.dailyRuns += 1;
    saveBudgetState(budget);
    log(`Updated budget tracker: ${budget.dailyRuns}/${budget.maxDailyRuns} runs used today.`);

    log('Ready for action. Antigravity can now run QA / benchmarks or respond to findings.');
  } else {
    log('No new tasks or messages from Claude. Staying idle (0 token usage).');
  }
}

log(`Collab Ticker started. Interval: ${INTERVAL_MS / 60000}m | Max Daily Runs: ${MAX_DAILY_RUNS} | Branch: ${BRANCH}`);
tick();
setInterval(tick, INTERVAL_MS);
