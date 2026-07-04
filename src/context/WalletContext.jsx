import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { Web3Auth } from '@web3auth/single-factor-auth'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import algosdk from 'algosdk'
import nacl from 'tweetnacl'
import { auth } from '../firebase.js'

const WalletContext = createContext(null)

const CLIENT_ID = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || 'BPi5eeTEVgJHZ2Fe7dUBCl7n9b1vxts4Xvtb_o9X7Xg_7Xvtb_o9X7Xg_7Xvtb_o9X7Xg_7Xvtb_o9X7Xg'
const VERIFIER_NAME = import.meta.env.VITE_WEB3AUTH_VERIFIER_NAME || 'el-fontanin-firebase-verifier'

// Configurazione standard EIP155 per l'inizializzazione del provider Web3Auth
const chainConfig = {
  chainNamespace: 'eip155',
  chainId: '0x1', // Ethereum Mainnet (necessario come segnaposto)
  rpcTarget: 'https://rpc.ankr.com/eth',
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [web3auth, setWeb3auth] = useState(null)

  // 1. Inizializzazione di Web3Auth Single Factor Auth
  useEffect(() => {
    async function initWeb3Auth() {
      try {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        })

        const w3a = new Web3Auth({
          clientId: CLIENT_ID,
          web3AuthNetwork: 'sapphire_devnet', // Sapphire Devnet per l'ambiente di test/sviluppo
          privateKeyProvider,
        })

        await w3a.init()
        setWeb3auth(w3a)
        console.log('[Wallet] Web3Auth SFA inizializzato con successo.')
      } catch (err) {
        console.error('[Wallet] Errore inizializzazione Web3Auth SFA:', err)
        setError(err.message)
      }
    }

    initWeb3Auth()
  }, [])

  // 2. Ascolto dello stato Firebase Auth per gestire il logout automatico del wallet
  useEffect(() => {
    if (!web3auth) return

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Utente disconnesso, ripulisci lo stato del wallet
        if (web3auth.connected) {
          try {
            await web3auth.logout()
          } catch (err) {
            console.error('[Wallet] Errore durante il logout di Web3Auth:', err)
          }
        }
        setWallet(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [web3auth])

  // Funzione manuale per connettere e derivare il wallet Algorand MPC
  const connectWallet = async () => {
    if (!web3auth) {
      throw new Error('Web3Auth non ancora inizializzato.')
    }
    if (!auth.currentUser) {
      throw new Error('Effettua prima l\'accesso con Google per sbloccare il Wallet.')
    }

    setLoading(true)
    setError(null)
    try {
      const firebaseUser = auth.currentUser
      const idToken = await firebaseUser.getIdToken()
      console.log('[Wallet] Connessione manuale a Web3Auth MPC...')

      let provider
      if (web3auth.connected) {
        provider = web3auth.provider
      } else {
        provider = await web3auth.connect({
          verifier: VERIFIER_NAME,
          verifierId: firebaseUser.email || firebaseUser.uid,
          idToken,
        })
      }

      // Estrazione della chiave privata grezza client-side via MPC/Shamir
      const privateKeyHex = await provider.request({
        method: 'private_key',
      })

      if (!privateKeyHex) {
        throw new Error('Nessuna chiave privata restituita da Web3Auth.')
      }

      // Conversione della chiave privata hex a byte array (Uint8Array)
      const cleanHex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex
      const privateKeyBytes = new Uint8Array(
        cleanHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      )

      // Derivazione del keypair Algorand dal seed MPC tramite tweetnacl
      const keys = nacl.sign.keyPair.fromSeed(privateKeyBytes)
      const secretKey = new Uint8Array(64)
      secretKey.set(keys.secretKey)

      const algorandAccount = {
        addr: algosdk.encodeAddress(keys.publicKey),
        sk: secretKey,
      }

      console.log('[Wallet] Wallet Algorand MPC derivato con successo:', algorandAccount.addr)
      setWallet(algorandAccount)
      setError(null)
      return algorandAccount.addr
    } catch (err) {
      console.error('[Wallet] Errore derivazione wallet MPC:', err)
      setError(err.message)
      setWallet(null)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // TODO: Implementare policy di recovery del wallet MPC
  // NOTA: Come da ADR-001, la policy di recovery è una decisione di governance
  // che spetta al Consiglio Direttivo dell'associazione Fine di Mondo APS.
  // Evitare l'implementazione autonoma di meccanismi di recupero chiavi.

  // Funzione per firmare transazioni Algorand
  const signTransaction = async (txn) => {
    if (!wallet) {
      throw new Error('Wallet non connesso. Impossibile firmare la transazione.')
    }
    try {
      console.log('[Wallet] Firma della transazione Algorand in corso...')
      const signedTxn = txn.signTxn(wallet.sk)
      console.log('[Wallet] Transazione firmata con successo.')
      return signedTxn
    } catch (err) {
      console.error('[Wallet] Errore durante la firma della transazione:', err)
      throw err
    }
  }

  return (
    <WalletContext.Provider
      value={{
        algorandAddress: wallet ? wallet.addr : null,
        loading,
        error,
        connectWallet,
        signTransaction,
        isConnected: !!wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet deve essere usato all\'interno di un WalletProvider.')
  }
  return context
}
