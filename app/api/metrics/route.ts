import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const memory = process.memoryUsage();
  const uptime = process.uptime();
  const load = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return NextResponse.json({
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
      total: totalMem,
      free: freeMem,
      percentage: ((totalMem - freeMem) / totalMem) * 100
    },
    cpu: {
      load: load[0], // 1 min load
      cores: os.cpus().length,
      percentage: Math.min(load[0] * 10, 100) // Rough approximation for 1-minute load scaled to percentage
    },
    uptime: Math.floor(uptime),
    nodeVersion: process.version,
    platform: process.platform
  });
}
