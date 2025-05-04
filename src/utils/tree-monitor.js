// Placeholder: Tree Monitor utility
// Watches project directory and reports file changes (pre-MVP)
import { watch } from 'fs';
import { relative } from 'path';

const ROOT = process.cwd();

function startTreeMonitor(dir = ROOT) {
  console.log(`[tree-monitor] Watching ${dir}`);
  watch(dir, { recursive: true }, (event, filename) => {
    if (!filename) return;
    const rel = relative(ROOT, `${dir}/${filename}`);
    console.log(`[tree-monitor] ${event}: ${rel}`);
  });
}

if (require.main === module) {
  startTreeMonitor();
}

export { startTreeMonitor }; 