import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.resolve(workspaceRoot, 'frontend', 'src', 'data', 'services.js');
const targetDir = path.resolve(workspaceRoot, 'backend', 'data');
const targetPath = path.resolve(targetDir, 'services.json');

const sourceModule = await import(pathToFileURL(sourcePath).href);

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetPath, JSON.stringify(sourceModule.services, null, 2));
