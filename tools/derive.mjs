import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
const kp = Ed25519Keypair.fromSecretKey(Buffer.from(process.env.PK, 'hex'));
console.log('pub :', Buffer.from(kp.getPublicKey().toRawBytes()).toString('hex'));
console.log('addr:', kp.getPublicKey().toSuiAddress());
