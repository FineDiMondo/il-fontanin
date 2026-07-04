import algosdk from 'algosdk';
import nacl from 'tweetnacl';

console.log('--- ALGORAND MPC WALLET DERIVATION & SIGNING TEST ---');

// 1. Simula la chiave privata da 32 byte che verrebbe restituita da Web3Auth (MPC / Shamir)
// In questo esempio usiamo un seed casuale o fisso di test
const mockPrivateKeyHex = 'f1e2d3c4b5a697887766554433221100f1e2d3c4b5a697887766554433221100'; // 32 byte / 64 hex characters
console.log('Chiave privata MPC simulata (Hex):', mockPrivateKeyHex);

const privateKeyBytes = new Uint8Array(
  mockPrivateKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
);

// 2. Deriva il keypair Algorand dal seed MPC usando tweetnacl
const keys = nacl.sign.keyPair.fromSeed(privateKeyBytes);
const secretKey = new Uint8Array(64);
secretKey.set(keys.secretKey);

const algorandAccount = {
  addr: algosdk.encodeAddress(keys.publicKey),
  sk: secretKey
};

console.log('Indirizzo Algorand derivato:', algorandAccount.addr);

// 3. Crea una transazione fittizia (mock) per Algorand Testnet
// Usiamo parametri di default standard per la transazione
const mockSuggestedParams = {
  fee: 1000n,
  genesisHash: new Uint8Array(Buffer.from('SGO1GKSzyE7IEP7YdsOMPtj5QX5H831v63gYBG8mrE4=', 'base64')), // Testnet genesis hash
  genesisID: 'testnet-v1.0',
  firstValid: 40000000n,
  lastValid: 40001000n,
  flatFee: true,
  minFee: 1000n
};

const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  sender: algorandAccount.addr,
  receiver: algorandAccount.addr, // Send to self for mock transaction test
  amount: 1000000, // 1 ALGO
  suggestedParams: mockSuggestedParams
});

// 4. Firma la transazione
console.log('Firma della transazione in corso...');
const signedTxnBytes = txn.signTxn(algorandAccount.sk);
console.log('Transazione firmata con successo! Lunghezza byte firmati:', signedTxnBytes.length);

// 5. Decodifica la transazione firmata per verificare la validità
const decodedTxn = algosdk.decodeSignedTransaction(signedTxnBytes);
console.log('Verifica transazione decodificata:');
console.log(decodedTxn.txn);
console.log('- Firma presente (sig):', decodedTxn.sig ? 'Sì' : 'No');

// Estrai sender e receiver usando le proprietà effettive di algosdk v3
const senderAddr = algosdk.encodeAddress(decodedTxn.txn.sender.publicKey);
const receiverAddr = algosdk.encodeAddress(decodedTxn.txn.payment.receiver.publicKey);

if (senderAddr === algorandAccount.addr && decodedTxn.sig) {
  console.log('🟢 TEST SUPERATO CON SUCCESSO!');
} else {
  console.error('🔴 ERRORE: La firma o i dati non corrispondono.');
  process.exit(1);
}
