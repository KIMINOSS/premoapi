import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const RESPONSES_DIR = path.join(process.cwd(), '..', 'hkmc_api_test', 'interface_responses');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(RESPONSES_DIR, decodedFilename);
    
    // Security: ensure path is within responses directory
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(RESPONSES_DIR))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    
    const content = await readFile(filePath, 'utf-8');
    const json = JSON.parse(content);
    
    return NextResponse.json(json);
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'File not found or invalid' },
      { status: 404 }
    );
  }
}
