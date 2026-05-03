import { exec } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { command, yoloMode } = await req.json();

    if (!command) {
      return NextResponse.json({ error: 'No command provided' }, { status: 400 });
    }

    const dangerousCommands = ['rm -rf /', 'mkfs', 'dd'];
    if (!yoloMode && dangerousCommands.some(dc => command.includes(dc))) {
      return NextResponse.json({ 
        error: 'Dangerous command blocked. Enable YOLO mode to override.',
        stdout: '',
        stderr: 'Permission Denied: Safety Filter Active'
      }, { status: 403 });
    }

    try {
      // Docker-based execution for isolation
      const escapedCommand = command.replace(/"/g, '\\"');
      const dockerCommand = `docker run --rm --network=none -v aria_sandbox:/workspace alpine:latest sh -c "${escapedCommand}"`;
      
      const { stdout, stderr } = await execPromise(dockerCommand, {
        timeout: 30000, // 30s timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });
      
      return NextResponse.json({ stdout, stderr });
    } catch (error: any) {
      return NextResponse.json({ 
        stdout: error.stdout || '', 
        stderr: error.stderr || error.message 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
