import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Using fileURLToPath as this is likely a module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.resolve(__dirname, '../src/messages');
const baseLocale = 'en.json';

// Helper to flatten nested JSON objects
function flatten(obj: Record<string, any>, prefix = ''): Record<string, string> {
    return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flatten(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}

async function validateLocales() {
    console.log('Validating locales...');
    const basePath = path.join(messagesDir, baseLocale);

    if (!fs.existsSync(basePath)) {
        console.error(`❌ Base locale file not found: ${basePath}`);
        process.exit(1);
    }

    const baseData = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
    const baseKeys = Object.keys(flatten(baseData)).sort();

    const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json') && f !== baseLocale);

    let hasErrors = false;

    for (const file of files) {
        const filePath = path.join(messagesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const keys = Object.keys(flatten(data)).sort();

        // Find missing keys
        const missing = baseKeys.filter(k => !keys.includes(k));
        // Find extra keys
        const extra = keys.filter(k => !baseKeys.includes(k));

        if (missing.length > 0 || extra.length > 0) {
            hasErrors = true;
            console.error(`\n❌ Mismatches found in ${file}:`);
            if (missing.length > 0) {
                console.error(`  Missing keys (${missing.length}):`);
                missing.slice(0, 10).forEach(k => console.error(`    - ${k}`));
                if (missing.length > 10) console.error(`    ...and ${missing.length - 10} more`);
            }
            if (extra.length > 0) {
                console.error(`  Extra keys (${extra.length}):`);
                extra.slice(0, 10).forEach(k => console.error(`    - ${k}`));
                if (extra.length > 10) console.error(`    ...and ${extra.length - 10} more`);
            }
        } else {
            console.log(`✅ ${file} is fully completely synchronized with ${baseLocale}`);
        }
    }

    if (hasErrors) {
        console.error('\n❌ Validation failed due to missing or extra translation keys.');
        process.exit(1);
    } else {
        console.log('\n✅ All language files are perfectly synchronized.');
        process.exit(0);
    }
}

validateLocales().catch(e => {
    console.error(e);
    process.exit(1);
});
