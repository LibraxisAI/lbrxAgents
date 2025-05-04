// Basic Semgrep scanner placeholder - expand later with MCP integration
import { execSync } from 'child_process';

export function runSemgrepScan(targetDir = '.', config = 'auto') {
  try {
    const cmd = `semgrep --config ${config} ${targetDir}`;
    console.log(`Running: ${cmd}`);
    const output = execSync(cmd, { stdio: 'inherit' });
    return output?.toString() ?? '';
  } catch (err) {
    console.error('Semgrep scan failed', err.message);
    return null;
  }
}

if (require.main === module) {
  runSemgrepScan(process.argv[2] || '.');
} 