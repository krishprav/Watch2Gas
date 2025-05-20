'use client';

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN, Idl, Wallet } from '@project-serum/anchor'
import { Wallet2, Zap, CheckCircle, Fuel, ArrowRight, Star, Sparkles, RefreshCw, Send, Clock, AlertCircle } from "lucide-react";

// Replace with your actual IDL
import { IDL } from '../../../utils/idl'

const PROGRAM_ID = new PublicKey("HRtVXSRabAJ8Mk2NfEFPhquhcgphYZJWnLBwbKxto2Xq")

interface ProgramState {
  admin: PublicKey;
  totalFunds: BN;
  totalAdsViewed: BN;
  totalTransactions: BN;
  feePerAd: BN;
  baseTransactionFee: BN;  
  isPaused: boolean;
  bump: number;
  treasuryBump: number;
}

interface Advertisement {
  id: string;
  url: string;
  content: string;
  rewardAmount: BN;
  displayDuration: BN;
  isActive: boolean;
  viewCount: BN;
  createdAt: BN;
  bump: number;
}

interface TransactionRequest {
  user: PublicKey;
  recipient: PublicKey;
  amount: BN;
  calculatedFee: BN;
  status: { waitingForAd?: object; completed?: object; cancelled?: object };
  selectedAdId: string;
  createdAt: BN;
  expiresAt: BN;
  adDisplayStartedAt: BN | null;
  completedAt: BN | null;
  cancelledAt: BN | null;
  adViewDuration: BN | null;
  bump: number;
}

interface AdForDisplay {
  id: string;
  content: string;
  url: string;
  displayDuration: number;
  rewardAmount: number;
}

const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};
const SolanaSymbol = ({ className = "h-5 w-5", ...props }) => (
  <svg
    viewBox="0 0 397.7 311.7"
    className={className}
    fill="currentColor"
    {...props}
  >
    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z"/>
    <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
    <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
  </svg>
);

export default function UserPanel() {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  
  const [programState, setProgramState] = useState<ProgramState | null>(null)
  const [programExists, setProgramExists] = useState<boolean>(false)
  const [pendingRequest, setPendingRequest] = useState<TransactionRequest | null>(null)
  const [currentAd, setCurrentAd] = useState<AdForDisplay | null>(null)
  const [adStartTime, setAdStartTime] = useState<number | null>(null)
  const [adViewTime, setAdViewTime] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [balance, setBalance] = useState<number>(0)
  
  const [recipientAddress, setRecipientAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [calculatedFee, setCalculatedFee] = useState<number>(0)
  
  const [showingAd, setShowingAd] = useState<boolean>(false)
  const [adTimeRemaining, setAdTimeRemaining] = useState<number>(0)
  const [canCompleteTransaction, setCanCompleteTransaction] = useState<boolean>(false)

  const getProvider = () => {
    if (!publicKey || !signTransaction) return null
    return new AnchorProvider(connection, { publicKey, signTransaction } as unknown as Wallet, {})
  }

  const getProgram = () => {
    const provider = getProvider()
    if (!provider) return null
    return new Program(IDL as Idl, PROGRAM_ID, provider)
  }

  const showError = (message: string) => {
    setError(message)
    setSuccess('')
    setTimeout(() => setError(''), 5000)
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setError('')
    setTimeout(() => setSuccess(''), 5000)
  }

  const calculateGasFee = (amount: number, state: ProgramState) => {
    const percentageFee = Math.floor(amount / 1000)
    return state.baseTransactionFee.toNumber() + percentageFee
  }

  const checkProgramExists = async () => {
    try {
      setLoading(true)
      const program = getProgram()
      if (!program) return

      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        PROGRAM_ID
      )

      const accountInfo = await connection.getAccountInfo(statePda)
      
      if (accountInfo) {
        setProgramExists(true)
        const state = await program.account.programState.fetch(statePda) as ProgramState
        setProgramState(state)
      } else {
        setProgramExists(false)
        setProgramState(null)
      }
    } catch (error) {
      console.error('Error checking program state:', error)
      setProgramExists(false)
      setProgramState(null)
      showError('Error checking program state')
    } finally {
      setLoading(false)
    }
  }

  const fetchBalance = async () => {
    if (!publicKey) return
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const checkPendingRequest = async () => {
    try {
      const program = getProgram()
      if (!program || !publicKey) return

      const [requestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("request"), publicKey.toBuffer()],
        PROGRAM_ID
      )

      const requestInfo = await connection.getAccountInfo(requestPda)
      if (requestInfo) {
        const request = await program.account.transactionRequest.fetch(requestPda) as TransactionRequest
        
        const currentTime = Math.floor(Date.now() / 1000)
        if (currentTime < request.expiresAt.toNumber() && 'waitingForAd' in request.status) {
          setPendingRequest(request)
          if (request.selectedAdId && request.adDisplayStartedAt) {
            await fetchAdForDisplay(request.selectedAdId)
          }
        }
      }
    } catch (error) {
      console.error('Error checking pending request:', error)
    }
  }

  const fetchAdForDisplay = async (adId: string) => {
    try {
      const program = getProgram()
      if (!program) return

      const [adPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ad"), Buffer.from(adId)],
        PROGRAM_ID
      )

      const ad = await program.account.advertisement.fetch(adPda) as Advertisement
      
      setCurrentAd({
        id: ad.id,
        content: ad.content,
        url: ad.url,
        displayDuration: ad.displayDuration.toNumber(),
        rewardAmount: ad.rewardAmount.toNumber()
      })
    } catch (error) {
      console.error('Error fetching ad:', error)
    }
  }

  const getRandomActiveAd = async (): Promise<Advertisement | null> => {
    try {
      const program = getProgram()
      if (!program) return null

      const ads = await program.account.advertisement.all()
      const activeAds = ads.filter((ad) => ad.account.isActive)
      
      if (activeAds.length === 0) {
        showError('No active advertisements available')
        return null
      }

      const randomIndex = Math.floor(Math.random() * activeAds.length)
      return activeAds[randomIndex].account as Advertisement
    } catch (error) {
      console.error('Error fetching random ad:', error)
      return null
    }
  }

  useEffect(() => {
    if (publicKey) {
      checkProgramExists()
      fetchBalance()
      checkPendingRequest()
    }
  }, [publicKey, connection])

  useEffect(() => {
    if (sendAmount && programState) {
      const amountInLamports = parseFloat(sendAmount) * LAMPORTS_PER_SOL
      const fee = calculateGasFee(amountInLamports, programState)
      setCalculatedFee(fee)
    } else {
      setCalculatedFee(0)
    }
  }, [sendAmount, programState])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (showingAd && adStartTime && currentAd) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - adStartTime) / 1000)
        setAdViewTime(elapsed)
        
        const remaining = Math.max(0, currentAd.displayDuration - elapsed)
        setAdTimeRemaining(remaining)
        
        if (remaining === 0) {
          setCanCompleteTransaction(true)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showingAd, adStartTime, currentAd])

  const validateTransactionInputs = (): boolean => {
    if (!recipientAddress.trim()) {
      showError('Recipient address is required')
      return false
    }

    let recipientPubkey: PublicKey
    try {
      recipientPubkey = new PublicKey(recipientAddress)
    } catch {
      showError('Invalid recipient address')
      return false
    }

    if (recipientPubkey.equals(PublicKey.default)) {
      showError('Invalid recipient address')
      return false
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      showError('Send amount must be greater than 0')
      return false
    }

    const amountInSol = parseFloat(sendAmount)
    if (amountInSol > balance) {
      showError('Insufficient balance')
      return false
    }

    return true
  }

  const initiateSendTransaction = async () => {
    if (!validateTransactionInputs()) return

    try {
      setLoading(true)
      const program = getProgram()
      if (!program || !programState) return

      const selectedAd = await getRandomActiveAd()
      if (!selectedAd) {
        showError('No active advertisements available')
        return
      }

      const recipient = new PublicKey(recipientAddress)
      const amount = new BN(parseFloat(sendAmount) * LAMPORTS_PER_SOL)

      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        PROGRAM_ID
      )

      const [requestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("request"), publicKey!.toBuffer()],
        PROGRAM_ID
      )

      const [adPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ad"), Buffer.from(selectedAd.id)],
        PROGRAM_ID
      )

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .initiateSendTransaction(recipient, amount)
        .accounts({
          state: statePda,
          request: requestPda,
          selectedAd: adPda,
          user: publicKey!,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([computeBudgetIx])
        .rpc()

      setCurrentAd({
        id: selectedAd.id,
        content: selectedAd.content,
        url: selectedAd.url,
        displayDuration: selectedAd.displayDuration.toNumber(),
        rewardAmount: selectedAd.rewardAmount.toNumber()
      })

      setShowingAd(true)
      setAdStartTime(Date.now())
      setAdViewTime(0)
      setAdTimeRemaining(selectedAd.displayDuration.toNumber())
      setCanCompleteTransaction(false)

      showSuccess('Transaction initiated! Please view the advertisement.')
      
      await checkPendingRequest()
    } catch (error) {
      console.error('Error initiating transaction:', error)
      showError('Error initiating transaction: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const completeTransactionAfterAd = async () => {
    if (!canCompleteTransaction || !pendingRequest || !currentAd) {
      showError('Please wait for the advertisement to finish')
      return
    }

    try {
      setLoading(true)
      const program = getProgram()
      if (!program) return

      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        PROGRAM_ID
      )

      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      )

      const [requestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("request"), publicKey!.toBuffer()],
        PROGRAM_ID
      )

      const [adPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ad"), Buffer.from(currentAd.id)],
        PROGRAM_ID
      )

      const feeAccount = new PublicKey("11111111111111111111111111111112")

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .completeTransactionAfterAd(new BN(adViewTime))
        .accounts({
          state: statePda,
          treasury: treasuryPda,
          ad: adPda,
          request: requestPda,
          user: publicKey!,
          recipient: pendingRequest.recipient,
          feeAccount: feeAccount,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([computeBudgetIx])
        .rpc()

      showSuccess('Transaction completed successfully! Gas fee was sponsored by the program.')
      
      setShowingAd(false)
      setCurrentAd(null)
      setPendingRequest(null)
      setAdStartTime(null)
      setAdViewTime(0)
      setCanCompleteTransaction(false)
      setRecipientAddress('')
      setSendAmount('')
      
      fetchBalance()
    } catch (error) {
      console.error('Error completing transaction:', error)
      showError('Error completing transaction: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const cancelRequest = async () => {
    if (!pendingRequest) return

    try {
      setLoading(true)
      const program = getProgram()
      if (!program) return

      const [requestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("request"), publicKey!.toBuffer()],
        PROGRAM_ID
      )

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .cancelRequest()
        .accounts({
          request: requestPda,
          user: publicKey!,
        })
        .preInstructions([computeBudgetIx])
        .rpc()

      showSuccess('Transaction request cancelled')
      
      setShowingAd(false)
      setCurrentAd(null)
      setPendingRequest(null)
      setAdStartTime(null)
      setAdViewTime(0)
      setCanCompleteTransaction(false)
    } catch (error) {
      console.error('Error cancelling request:', error)
      showError('Error cancelling request: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent animate-pulse"></div>
      </div>
  
      {/* Header */}
     
  
      <main className="relative z-10 container mx-auto px-6 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}
        {loading && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 flex items-center gap-3">
            <RefreshCw className="h-5 w-5 flex-shrink-0 animate-spin" />
            Processing...
          </div>
        )}
  
        {!publicKey ? (
          // Welcome Section
          <div className="text-center py-20">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                  <SolanaSymbol className="h-16 w-16 text-white animate-pulse" />
                </div>
                <h1 className="text-5xl font-bold mb-6">
                  Welcome to{' '}
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Watch2Gas
                  </span>
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Send SOL transactions with zero gas fees by watching short advertisements
                </p>
              </div>
  
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Zap, title: "Instant Coverage", desc: "Gas fees paid immediately after watching ads" },
                  { icon: Wallet2, title: "Any Wallet", desc: "Works with all Solana wallets and dApps" },
                  { icon: Clock, title: "Quick Ads", desc: "Watch 15-30 second advertisements only" }
                ].map((feature, index) => (
                  <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <feature.icon className="h-6 w-6 text-purple-400" />
                      </div>
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
  
              <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <h2 className="text-2xl font-bold mb-4">Connect Your Wallet to Get Started</h2>
                <p className="text-gray-300 mb-6">Connect your Solana wallet to start sending transactions with sponsored gas fees</p>
                <div className="flex justify-center">
                  <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 !rounded-xl !text-white !font-semibold hover:!from-purple-500 hover:!to-blue-500 !transition-all !duration-300 !transform hover:!scale-105 !px-8 !py-4" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Wallet Info Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Wallet2 className="h-6 w-6 text-purple-400" />
                  Wallet Information
                </h2>
                <button 
                  onClick={fetchBalance} 
                  disabled={loading}
                  className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Connected Wallet</p>
                  <p className="font-mono text-lg">{formatAddress(publicKey.toString())}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Balance</p>
                  <p className="text-2xl font-bold text-green-400">{balance.toFixed(6)} SOL</p>
                </div>
              </div>
            </div>
  
            {/* Protocol Status */}
            {programExists && programState && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Zap className="h-6 w-6 text-blue-400" />
                  Protocol Status
                </h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Status</p>
                    <p className={`font-bold ${programState.isPaused ? 'text-red-400' : 'text-green-400'}`}>
                      {programState.isPaused ? 'PAUSED' : 'ACTIVE'}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Available Funds</p>
                    <p className="font-bold text-blue-400">
                      {(programState.totalFunds.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Transactions</p>
                    <p className="font-bold text-purple-400">{programState.totalTransactions.toString()}</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Ads Viewed</p>
                    <p className="font-bold text-pink-400">{programState.totalAdsViewed.toString()}</p>
                  </div>
                </div>
              </div>
            )}
  
            {/* Ad Viewing Section */}
            {showingAd && currentAd && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/50">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-3">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                    Watch Advertisement
                  </h2>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span>Time Remaining: <strong className="text-blue-400">{adTimeRemaining}s</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>Reward: <strong className="text-yellow-400">{(currentAd.rewardAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL</strong></span>
                    </div>
                  </div>
                </div>
  
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(adViewTime / currentAd.displayDuration) * 100}%` }}
                    ></div>
                  </div>
                </div>
  
                {/* Ad Content */}
                <div className="mb-6 p-6 rounded-xl bg-black/30 border border-white/10">
                  {isYouTubeUrl(currentAd.url) ? (
                    <div className="text-center">
                      <iframe
                        width="100%"
                        height="315"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(currentAd.url)}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                        title="Advertisement Video"
                        frameBorder="0"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-xl"
                      ></iframe>
                      <p className="mt-3 text-sm text-gray-400">
                        If video doesn&apos;t load,s; <a href={currentAd.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">click here to watch on YouTube</a>
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-4">Advertisement Content</h3>
                      <p className="text-gray-300 mb-4">{currentAd.content}</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a 
                          href={currentAd.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
  
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {canCompleteTransaction ? (
                    <button 
                      onClick={completeTransactionAfterAd} 
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-green-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Complete Transaction
                    </button>
                  ) : (
                    <div className="text-center py-3 px-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300">
                      Please wait for advertisement to finish
                    </div>
                  )}
                  
                  <button 
                    onClick={cancelRequest} 
                    disabled={loading}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            )}
  
            {/* Send Transaction Form */}
            {!showingAd && !pendingRequest && programExists && programState && !programState.isPaused && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Send className="h-6 w-6 text-purple-400" />
                  Send Transaction with Sponsored Gas Fees
                </h2>
                
                <p className="text-gray-300 mb-6">Send SOL to any address and have your gas fees sponsored by viewing an advertisement!</p>
  
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
                    <input
                      type="text"
                      placeholder="Enter recipient's public key"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount (SOL)</label>
                    <input
                      type="number"
                      placeholder="0.001"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      step="0.001"
                      min="0.001"
                      max={balance}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1">Available: {balance.toFixed(6)} SOL</p>
                  </div>
                </div>
  
                {calculatedFee > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mb-6">
                    <h3 className="font-bold mb-3 text-purple-300">Transaction Summary</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Amount to Send</p>
                        <p className="font-bold text-white">{sendAmount} SOL</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Gas Fee</p>
                        <p className="font-bold text-green-400">SPONSORED</p>
                        <p className="text-xs text-gray-500">({(calculatedFee / LAMPORTS_PER_SOL).toFixed(6)} SOL)</p>
                      </div>
                      <div>
                        <p className="text-gray-400"><span>You Pay</span></p>
                        <p className="font-bold text-blue-400">{sendAmount} SOL</p>
                      </div>
                    </div>
                  </div>
                )}
  
                <button 
                  onClick={initiateSendTransaction} 
                  disabled={loading || !recipientAddress || !sendAmount || (programState && programState.totalFunds.toNumber() < calculatedFee)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SolanaSymbol className="h-5 w-5" />
                  {programState && programState.totalFunds.toNumber() < calculatedFee ? 
                    'Insufficient Program Funds for Gas Sponsorship' : 
                    'Send Transaction (View Ad First)'
                  }
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
  
            {/* Pending Request */}
            {pendingRequest && !showingAd && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/50">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                  Pending Transaction
                </h2>
                <p className="text-gray-300 mb-6">You have a pending transaction request. Complete the advertisement viewing to proceed.</p>
  
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Recipient</p>
                    <p className="font-mono">{formatAddress(pendingRequest.recipient.toString())}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Amount</p>
                    <p className="font-bold text-blue-400">{(pendingRequest.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Gas Fee (Sponsored)</p>
                    <p className="font-bold text-green-400">{(pendingRequest.calculatedFee.toNumber() / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-gray-400 text-sm mb-1">Expires</p>
                    <p className="text-sm">{new Date(pendingRequest.expiresAt.toNumber() * 1000).toLocaleString()}</p>
                  </div>
                </div>
                
                <button 
                  onClick={cancelRequest} 
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
                >
                  Cancel Request
                </button>
              </div>
            )}
  
            {/* Error States */}
            {!programExists && (
              <div className="text-center py-12">
                <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-md mx-auto">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2 text-red-300">Program Not Available</h2>
                  <p className="text-gray-300">The fee payment program is not initialized or not available.</p>
                </div>
              </div>
            )}
  
            {programExists && programState?.isPaused && (
              <div className="text-center py-12">
                <div className="p-8 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 max-w-md mx-auto">
                  <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2 text-yellow-300">Program Paused</h2>
                  <p className="text-gray-300">The fee payment program is currently paused. Please try again later.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
  
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 bg-black/50 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Fuel className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Watch2Gas
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Watch2Gas. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}