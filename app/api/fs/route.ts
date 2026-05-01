import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'list'; // 'list' or 'read'
    const targetPath = searchParams.get('path') || '.';

    // Security: Prevent accessing files outside workspace
    // In this specific sandbox, we allow reading the app tree
    const root = process.cwd();
    const absolutePath = path.resolve(root, targetPath);

    if (!absolutePath.startsWith(root)) {
      return NextResponse.json({ error: 'Access Denied: Path outside workspace' }, { status: 403 });
    }

    if (mode === 'read') {
      const stats = await fs.stat(absolutePath);
      if (stats.isDirectory()) {
        return NextResponse.json({ error: 'Cannot read content of a directory' }, { status: 400 });
      }
      const content = await fs.readFile(absolutePath, 'utf-8');
      return NextResponse.json({ content });
    }

    // Default mode: list
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    const files = entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      size: entry.isDirectory() ? 0 : 0, // Could fetch stats if needed
      path: path.relative(root, path.join(absolutePath, entry.name)),
    }));

    return NextResponse.json({ files, currentPath: path.relative(root, absolutePath) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, source, destination } = await req.json();
    const root = process.cwd();

    const resolveAndVerify = (p: string) => {
      const absolute = path.resolve(root, p);
      if (!absolute.startsWith(root)) {
        throw new Error('Access Denied: Path outside workspace');
      }
      return absolute;
    };

    const sourcePath = resolveAndVerify(source);

    switch (action) {
      case 'delete':
        await fs.rm(sourcePath, { recursive: true });
        return NextResponse.json({ success: true });
      
      case 'move': {
        const destPath = resolveAndVerify(destination);
        await fs.rename(sourcePath, destPath);
        return NextResponse.json({ success: true });
      }

      case 'copy': {
        const destPath = resolveAndVerify(destination);
        await fs.cp(sourcePath, destPath, { recursive: true });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
