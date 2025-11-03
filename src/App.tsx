// ========================================
// IMPORTS - Librerías que necesitamos
// ========================================

// React hooks para manejar estado
import { useState } from 'react'

// Freighter API para conectar la wallet
import { isConnected, requestAccess } from '@stellar/freighter-api'

// NUEVO: Importar el cliente del contrato BDB
// Este archivo fue generado automáticamente en Paso 5 de la Parte 2
import { Client } from '../packages/token_bdb'

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

function App() {
  // ========================================
  // ESTADO - Variables que React va a "vigilar"
  // ========================================
  
  // Public key del usuario (su dirección Stellar)
  const [publicKey, setPublicKey] = useState<string>('')
  
  // Si la wallet está conectada o no
  const [connected, setConnected] = useState<boolean>(false)

  const [selectedWallet, setSelectedWallet] = useState<string>("");

  const [wallets, setWallets] = useState<string[]>(() => {
    const saved = localStorage.getItem("wallets");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning" | "info";
      title: string;
      message: string;
      duration?: number;
    }>
  >([]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  // NUEVO: Estado para el balance
  const [balance, setBalance] = useState<string>('0')
  
  // NUEVO: Estado para mostrar "Cargando..."
  const [loading, setLoading] = useState<boolean>(false)

  // ========================================
  // FUNCIÓN: Conectar Wallet
  // ========================================
  
  const connectWallet = async () => {
    try {
      // 1. Verificar si Freighter está instalado
      if (await isConnected()) {
        // 2. Pedir accesso
        const access = await requestAccess()
        
        // 3. Guardar en el estado
        if (access) {
          // 3. Obtener la public key del usuario
          const pk = access.address;
          
          // 4. Guardar en el estado
          setPublicKey(pk);
          setConnected(true);
          addWallet(pk); // Agregar a la lista de wallets
          setSelectedWallet(pk);
          
          showNotification(
            "success",
            "¡Freighter Conectado!",
            "Tu wallet se conectó exitosamente 🎉"
          );
          // 4. Log para debugging (ver en consola F12)
          console.log("Wallet conectada:", pk);
        } else {
          showNotification(
            "warning",
            "Acceso Denegado",
            "No se otorgó acceso a la wallet. Intenta de nuevo."
          );
        }
      } else {
        // Si Freighter no está instalado, mostrar alerta
        alert('Por favor instalá Freighter wallet desde https://freighter.app')
      }
    } catch (error) {
      // Si algo sale mal, mostrar el error
      console.error('Error conectando wallet:', error)
      alert('Error al conectar. Asegurate de que Freighter esté instalado y desbloqueado.')
    }
  }

  const addWallet = (walletAddress: string) => {
    if (!wallets.includes(walletAddress)) {
      const newWallets = [...wallets, walletAddress];
      setWallets(newWallets);
      localStorage.setItem("wallets", JSON.stringify(newWallets));
    }
  };

  // Mostrar notificación
  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const id = Date.now().toString();
    const notification = { id, type, title, message, duration };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remover después de la duración especificada
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  // ========================================
  // FUNCIÓN NUEVA: Obtener Balance
  // ========================================
  
  const getBalance = async () => {
    // 1. Verificar que la wallet esté conectada
    if (!connected) {
      alert('Conectá tu wallet primero')
      return
    }

    // 2. Mostrar estado de carga
    setLoading(true)
    
    try {
      // 3. Obtener Contract ID desde variables de entorno
      const contractId = import.meta.env.VITE_BDB_CONTRACT_ID
      //const rpcUrl = import.meta.env.VITE_STELLAR_RPC_URL;
      //console.log("VITE_STELLAR_RPC_URL:", import.meta.env.VITE_STELLAR_RPC_URL);

      console.log("Contract ID:", contractId);
      //console.log("RPC URL:", rpcUrl);

      // 4. Crear instancia del cliente del contrato
      const client = new Client({
        contractId: contractId,
        networkPassphrase: 'Test SDF Network ; September 2015', // Testnet
        rpcUrl: 'https://soroban-testnet.stellar.org'
      })

      // 5. Llamar a la función balance del contrato
      // Le pasamos la public key del usuario
      const tx = await client.balance({ account: publicKey });
      console.log("Transacción simulada:", tx);

      const raw = tx.result; // Este es el bigint
      const formatted = (Number(raw) / 10000000).toFixed(2);
      setBalance(formatted);
      
      // 6. Guardar el resultado en el estado
      //setBalance(result.toString())
      
      // 7. Log para debugging
      // console.log('Balance obtenido:', result.toString())
      
    } catch (error) {
      // Si algo sale mal, mostrar el error
      console.error('Error obteniendo balance:', error)
      alert('Error al obtener balance. Verificá que el contrato esté deployado.')
    } finally {
      // 8. Ocultar estado de carga (pase lo que pase)
      setLoading(false)
    }
  }
      
  // ========================================
  // INTERFAZ - Lo que el usuario ve
  // ========================================
  
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#0088cc' }}>Mi Token BDB</h1>
      
      {!connected ? (
        <div>
          <p>Conectá tu wallet para interactuar con el token BDB</p>
          
          <button 
            onClick={connectWallet}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#0088cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Conectar Wallet
          </button>
        </div>
      ) : (
        <div>
          {/* Información de conexión */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <p style={{ fontWeight: 'bold' }}>Conectado como:</p>
            <code style={{ 
              backgroundColor: '#fff', 
              padding: '8px', 
              borderRadius: '4px',
              display: 'block',
              marginTop: '8px',
              wordBreak: 'break-all'
            }}>
              {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
            </code>
          </div>

          {/* NUEVO: Botón para ver balance */}
          <div style={{ marginTop: '30px' }}>
            <button 
              onClick={getBalance}
              disabled={loading} // Deshabilitar mientras carga
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: loading ? '#ccc' : '#00cc88', // Gris si está cargando
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Cargando...' : 'Ver mi Balance BDB'}
            </button>

            {/* NUEVO: Mostrar el balance */}
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#666' }}>
                Balance actual:
              </p>
              <p style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                margin: '0',
                color: '#00cc88'
              }}>
                {balance} BDB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App