import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
const jsFiles=[];function walk(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,x.name);if(x.isDirectory())walk(p);else if(p.endsWith('.js'))jsFiles.push(p);}}
walk(path.join(root,'assets/js'));
test('all literal DOM IDs referenced by application exist in index.html',()=>{
 const refs=new Set();for(const f of jsFiles){const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/\$\('([^']+)'\)/g))refs.add(m[1]);}
 const missing=[...refs].filter(x=>!ids.has(x));assert.deepEqual(missing,[]);
});
test('all relative ES module imports resolve',()=>{
 const missing=[];for(const f of jsFiles){const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/from\s+['"](\.[^'"]+)['"]/g)){if(!fs.existsSync(path.resolve(path.dirname(f),m[1])))missing.push(`${path.relative(root,f)} -> ${m[1]}`);}}
 assert.deepEqual(missing,[]);
});
test('frontend bundle contains no service-role or secret key literals',()=>{
 const source=[html,...jsFiles.map(f=>fs.readFileSync(f,'utf8'))].join('\n');
 assert.equal(/sb_secret_|service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(source),false);
});
