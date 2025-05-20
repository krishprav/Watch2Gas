'use client';
//Watch2Gas
import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN, Wallet, Idl } from '@project-serum/anchor'
import { BarChart3, DollarSign, Users, Settings, Plus, List, Home, Activity } from 'lucide-react';

// Replace with your actual IDL
import { IDL } from '../../../utils/idl'

const PROGRAM_ID = new PublicKey("HRtVXSRabAJ8Mk2NfEFPhquhcgphYZJWnLBwbKxto2Xq")
const MIN_REWARD_LAMPORTS = 1000; // 0.001 SOL


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

interface AdAccount {
  publicKey: PublicKey;
  account: Advertisement;
}
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
}

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}
export default function AdminPanel() {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  
  // State management
  const [programState, setProgramState] = useState<ProgramState | null>(null)
  const [programExists, setProgramExists] = useState<boolean>(false)
  const [ads, setAds] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  // Form states
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [newBaseFee, setNewBaseFee] = useState('')
  const [newAd, setNewAd] = useState({
    id: '',
    url: '',
    content: '',
    rewardAmount: '',
    displayDuration: '5'
  })

  const getProvider = () => {
    if (!publicKey || !signTransaction) return null
    
    return new AnchorProvider(connection, { publicKey, signTransaction } as unknown as Wallet, {})
  }

  const getProgram = () => {
    const provider = getProvider()
    if (!provider) return null
    // Replace IDL with your actual IDL
    return new Program(IDL as Idl, PROGRAM_ID, provider)
  }

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(''), 5000)
  }

  const showSuccess = (message: string) => {
    alert(message) // You can replace this with a toast notification
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
        
        // Also fetch treasury balance
        const [treasuryPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("treasury")],
          PROGRAM_ID
        )
        const treasuryInfo = await connection.getAccountInfo(treasuryPda)
        console.log('Treasury balance:', treasuryInfo?.lamports || 0)
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

  const fetchAds = async () => {
    try {
      const program = getProgram()
      if (!program || !programExists) return
      
      const ads = await program.account.advertisement.all() as AdAccount[]
      setAds(ads)
    } catch (error) {
      console.error('Error fetching ads:', error)
      setAds([])
      showError('Error fetching advertisements')
    }
  }

  const fetchStats = async () => {
    try {
      const program = getProgram()
      if (!program || !programExists) return

      // Fetch all transaction requests to get more stats
      const requests = await program.account.transactionRequest.all()
      console.log('Total requests:', requests.length)
      
      // You can process requests for additional statistics here
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    if (publicKey) {
      checkProgramExists()
    }
  }, [publicKey])

  useEffect(() => {
    if (programExists) {
      fetchAds()
      fetchStats()
    }
  }, [programExists])

  const initializeProgram = async () => {
    if (!publicKey) {
      showError('Wallet not connected')
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

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .initialize()
        .accounts({
          state: statePda,
          treasury: treasuryPda,
          deployer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([computeBudgetIx])
        .rpc()
      
      showSuccess('Program initialized successfully!')
      await checkProgramExists()
    } catch (error) {
      console.error('Error initializing program:', error)
      showError('Error initializing program: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const depositFunds = async () => {
    if (!publicKey) {
      showError('Wallet not connected')
      return
    }
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showError('Please enter a valid deposit amount')
      return
    }

    const amountInSol = parseFloat(depositAmount)
    if (amountInSol > 10) {
      showError('Maximum deposit amount is 10 SOL')
      return
    }

    try {
      setLoading(true)
      const program = getProgram()
      if (!program) return
      if (!publicKey) {
        showError('Wallet not connected')
        return
      }

      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        PROGRAM_ID
      )

      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      )

      const amount = new BN(amountInSol * LAMPORTS_PER_SOL)

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .depositFunds(amount)
        .accounts({
          state: statePda,
          treasury: treasuryPda,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([computeBudgetIx])
        .rpc()
      
      showSuccess(`Successfully deposited ${amountInSol} SOL!`)
      setDepositAmount('')
      await checkProgramExists()
    } catch (error) {
      console.error('Error depositing funds:', error)
      showError('Error depositing funds: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const withdrawFunds = async () => {
    if (!publicKey) {
      showError('Wallet not connected')
      return
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showError('Please enter a valid withdrawal amount')
      return
    }

    const amountInSol = parseFloat(withdrawAmount)
    const availableBalance = programState ? programState.totalFunds.toNumber() / LAMPORTS_PER_SOL : 0

    if (amountInSol > availableBalance) {
      showError(`Insufficient funds. Available: ${availableBalance.toFixed(4)} SOL`)
      return
    }

    try {
      setLoading(true)
      const program = getProgram()
      if (!program) return
      if (!publicKey) {
        showError('Wallet not connected')
        return
      }
      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        PROGRAM_ID
      )

      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      )

      const amount = new BN(amountInSol * LAMPORTS_PER_SOL)

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .withdrawFunds(amount)
        .accounts({
          state: statePda,
          treasury: treasuryPda,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([computeBudgetIx])
        .rpc()
      
      showSuccess(`Successfully withdrew ${amountInSol} SOL!`)
      setWithdrawAmount('')
      await checkProgramExists()
    } catch (error) {
      console.error('Error withdrawing funds:', error)
      showError('Error withdrawing funds: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const updateBaseFee = async () => {
    
    if (!newBaseFee || parseInt(newBaseFee) <= 0) {
      showError('Please enter a valid base fee amount')
      return
    }

    try {
      setLoading(true)
      const program = getProgram()
      if (!program) return
      if (!publicKey) {
        showError('Wallet not connected')
        return
      }
     
      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        PROGRAM_ID
      )

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .updateBaseFee(new BN(parseInt(newBaseFee)))
        .accounts({
          state: statePda,
          admin: publicKey,
        })
        .preInstructions([computeBudgetIx])
        .rpc()
      
      showSuccess('Base fee updated successfully!')
      setNewBaseFee('')
      await checkProgramExists()
    } catch (error) {
      console.error('Error updating base fee:', error)
      showError('Error updating base fee: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const togglePause = async () => {
    if (!publicKey) {
      showError('Wallet not connected')
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

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .togglePause()
        .accounts({
          state: statePda,
          admin: publicKey,
        })
        .preInstructions([computeBudgetIx])
        .rpc()
      
      showSuccess(`Program ${programState?.isPaused ? 'unpaused' : 'paused'} successfully!`)
      await checkProgramExists()
    } catch (error) {
      console.error('Error toggling pause:', error)
      showError('Error toggling pause: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const createAd = async () => {
    if (!publicKey) {
      showError('Wallet not connected')
      return
    }
    // Validation
    if (!newAd.id.trim()) {
      showError('Ad ID is required')
      return
    }
    if (newAd.id.length > 32) {
      showError('Ad ID must be 32 characters or less')
      return
    }
    if (!newAd.url.trim()) {
      showError('Ad URL is required')
      return
    }
    if (!newAd.url.startsWith('https://')) {
      showError('Ad URL must start with https://')
      return
    }
    if (newAd.url.length > 200) {
      showError('Ad URL must be 200 characters or less')
      return
    }
    if (!newAd.content.trim()) {
      showError('Ad content is required')
      return
    }
    if (newAd.content.length > 500) {
      showError('Ad content must be 500 characters or less')
      return
    }

    const rewardInLamports = parseInt(newAd.rewardAmount)
    if (isNaN(rewardInLamports) || rewardInLamports < MIN_REWARD_LAMPORTS) {
      showError(`Reward amount must be at least ${MIN_REWARD_LAMPORTS} lamports`)
      return
    }

    const displayDuration = parseInt(newAd.displayDuration)
    if (isNaN(displayDuration) || displayDuration < 5) {
      showError('Display duration must be at least 5 seconds')
      return
    }

    try {
      setLoading(true)
      const program = getProgram()

      if (!program) return
      if (!publicKey) {
        showError('Wallet not connected')
        return
      }

      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        PROGRAM_ID
      )

      const [adPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ad"), Buffer.from(newAd.id)],
        PROGRAM_ID
      )

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .createAd(
          newAd.id,
          newAd.url,
          newAd.content,
          new BN(rewardInLamports),
          new BN(displayDuration)
        )
        .accounts({
          state: statePda,
          ad: adPda,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([computeBudgetIx])
        .rpc()

      showSuccess('Advertisement created successfully!')
      setNewAd({ id: '', url: '', content: '', rewardAmount: '', displayDuration: '5' })
      fetchAds()
    } catch (error) {
      console.error('Error creating ad:', error)
      showError('Error creating ad: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const toggleAd = async (adPublicKey: PublicKey, adId: string, currentStatus: boolean) => {
    if (!publicKey) {
      showError('Wallet not connected')
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

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })

      await program.methods
        .toggleAd()
        .accounts({
          state: statePda,
          ad: adPublicKey,
          admin: publicKey,
        })
        .preInstructions([computeBudgetIx])
        .rpc()
      
      showSuccess(`Ad "${adId}" ${currentStatus ? 'deactivated' : 'activated'} successfully!`)
      fetchAds()
    } catch (error) {
      console.error('Error toggling ad:', error)
      showError('Error toggling ad: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = programState?.admin?.equals(publicKey || PublicKey.default)
  const StatCard = ({ title, value, icon: Icon, iconBg = "bg-blue-500" }:StatCardProps) => (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${iconBg} p-3 rounded-lg bg-opacity-20`}>
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
      </div>
    </div>
  );
  
  const SidebarItem = ({ icon: Icon, label, isActive, onClick }:SidebarItemProps) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
        isActive 
          ? 'text-white bg-gray-900 border-r-2 border-blue-500' 
          : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
  
  // 4. Add these render functions before your main return statement
  const renderDashboard = () => (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">Overview of your fee payment platform activity.</p>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Tasks" 
          value={programState?.totalTransactions?.toString() || "0"} 
          icon={BarChart3}
          iconBg="bg-blue-500"
        />
        <StatCard 
          title="SOL Spent" 
          value={`${programState ? (programState.totalFunds.toNumber() / LAMPORTS_PER_SOL).toFixed(2) : "0"} SOL`}
          icon={DollarSign}
          iconBg="bg-green-500"
        />
        <StatCard 
          title="User Engagement" 
          value={programState?.totalAdsViewed?.toString() || "0"}
          icon={Users}
          iconBg="bg-purple-500"
        />
      </div>
  
      {programState && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Program Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Status</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                programState.isPaused ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
              }`}>
                {programState.isPaused ? 'PAUSED' : 'ACTIVE'}
              </span>
            </div>
            <div>
              <p className="text-gray-400">Admin</p>
              <p className="text-white font-mono text-sm">{programState.admin.toString().slice(0, 20)}...</p>
            </div>
            <div>
              <p className="text-gray-400">Base Transaction Fee</p>
              <p className="text-white">{programState.baseTransactionFee.toString()} lamports</p>
            </div>
            <div>
              <p className="text-gray-400">Fee Per Ad</p>
              <p className="text-white">{programState.feePerAd.toString()} lamports</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your platform configuration and funds.</p>
      </div>
  
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Fund Management</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Deposit Funds</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Amount (SOL)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.001"
                  max="10"
                  disabled={loading}
                />
                <button
                  onClick={depositFunds}
                  disabled={loading || !depositAmount}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Deposit
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Maximum deposit: 10 SOL</p>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Withdraw Funds</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Amount (SOL)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.001"
                  disabled={loading}
                />
                <button
                  onClick={withdrawFunds}
                  disabled={loading || !withdrawAmount}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Withdraw
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {programState ? (programState.totalFunds.toNumber() / LAMPORTS_PER_SOL).toFixed(6) : '0'} SOL
              </p>
            </div>
          </div>
        </div>
  
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Fee Configuration</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Base Transaction Fee</label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Base fee (lamports)"
                value={newBaseFee}
                onChange={(e) => setNewBaseFee(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                disabled={loading}
              />
              <button
                onClick={updateBaseFee}
                disabled={loading || !newBaseFee}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Update
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current: {programState?.baseTransactionFee?.toString() || '0'} lamports
            </p>
          </div>
        </div>
      </div>
  
      {programState && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Program Control</h3>
          <button
            onClick={togglePause}
            disabled={loading}
            className={`${
              programState.isPaused 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            } disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors`}
          >
            {programState.isPaused ? 'Unpause Program' : 'Pause Program'}
          </button>
        </div>
      )}
    </div>
  );
  
  const renderCreateTask = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Create Task</h1>
        <p className="text-gray-400 mt-2">Create new advertisements for your platform.</p>
      </div>
  
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-6">New Advertisement</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ad ID</label>
              <input
                type="text"
                placeholder="Ad ID (max 32 chars)"
                value={newAd.id}
                onChange={(e) => setNewAd({...newAd, id: e.target.value})}
                maxLength={32}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{newAd.id.length}/32 characters</p>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ad URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={newAd.url}
                onChange={(e) => setNewAd({...newAd, url: e.target.value})}
                maxLength={200}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{newAd.url.length}/200 characters</p>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Reward Amount (lamports)</label>
              <input
                type="number"
                placeholder={`Min: ${MIN_REWARD_LAMPORTS}`}
                value={newAd.rewardAmount}
                onChange={(e) => setNewAd({...newAd, rewardAmount: e.target.value})}
                min={MIN_REWARD_LAMPORTS}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Display Duration (seconds)</label>
              <input
                type="number"
                placeholder="Min: 5 seconds"
                value={newAd.displayDuration}
                onChange={(e) => setNewAd({...newAd, displayDuration: e.target.value})}
                min="5"
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Ad Content</label>
            <textarea
              placeholder="Advertisement content (max 500 chars)"
              value={newAd.content}
              onChange={(e) => setNewAd({...newAd, content: e.target.value})}
              maxLength={500}
              rows={8}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">{newAd.content.length}/500 characters</p>
          </div>
        </div>
  
        <div className="mt-6">
          <button
            onClick={createAd}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create Advertisement
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderMyTasks = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Tasks</h1>
        <p className="text-gray-400 mt-2">Manage your existing advertisements.</p>
      </div>
  
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Advertisements ({ads.length})</h3>
        </div>
  
        {ads.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No advertisements created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-4 ${
                  ad.account.isActive 
                    ? 'border-gray-300/50 bg-gray-900/50 bg-opacity-20' 
                    : 'border-gray-300/50 bg-gray-900/50 bg-opacity-20'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">{ad.account.id}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ad.account.isActive 
                      ? 'bg-green-600 text-green-100' 
                      : 'bg-red-600 text-red-100'
                  }`}>
                    {ad.account.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">URL:</p>
                    <a 
                      href={ad.account.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all"
                    >
                      {ad.account.url}
                    </a>
                  </div>
                  <div>
                    <p className="text-gray-400">Views:</p>
                    <p className="text-white">{ad.account.viewCount.toString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Reward:</p>
                    <p className="text-white">{ad.account.rewardAmount.toString()} lamports</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration:</p>
                    <p className="text-white">{ad.account.displayDuration.toString()} seconds</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-400 text-sm">Content:</p>
                  <p className="text-white text-sm mt-1">{ad.account.content}</p>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => toggleAd(ad.publicKey, ad.account.id, ad.account.isActive)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      ad.account.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:bg-gray-600`}
                  >
                    {ad.account.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900/50 flex">
      {!publicKey ? (
        <div className="min-h-screen bg-black-900 flex items-center justify-center w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400">Please connect your wallet to access the admin panel.</p>
          </div>
        </div>
      ) : !programExists ? (
        <div className="min-h-screen bg-black-900/50 flex items-center justify-center w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Initialize Program</h2>
            <p className="text-gray-400 mb-6">The program hasn&apos;t been initialized yet.</p>
            <button
              onClick={initializeProgram}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Initialize Program
            </button>
          </div>
        </div>
      ) : !isAdmin ? (
        <div className="min-h-screen bg-black-900/50 flex items-center justify-center w-full">
          <div className="text-center bg-gray-800 border border-red-600 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-4">You are not the admin of this program.</p>
            <div className="text-sm text-gray-500">
              <p><strong>Program Admin:</strong> {programState?.admin.toString()}</p>
              <p><strong>Your Wallet:</strong> {publicKey.toString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <div className="w-64  bg-gradient-to-b from-black to-gray-900/50 border-r border-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Watch2Gas Admin</span>
              </div>
            </div>
            
            <nav className="mt-8">
              <SidebarItem
                icon={Home}
                label="Dashboard"
                isActive={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              />
              <SidebarItem
                icon={Plus}
                label="Create Task"
                isActive={activeTab === 'create'}
                onClick={() => setActiveTab('create')}
              />
              <SidebarItem
                icon={List}
                label="My Tasks"
                isActive={activeTab === 'tasks'}
                onClick={() => setActiveTab('tasks')}
              />
              <SidebarItem
                icon={Settings}
                label="Settings"
                isActive={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
              />
            </nav>
          </div>
  
          {/* Main Content */}
          <div className="flex-1 overflow-auto   bg-gradient-to-b from-black to-gray-900/50">
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-900 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
  
              {loading && (
                <div className="mb-6 bg-blue-900 border border-blue-600 text-blue-300 px-4 py-3 rounded-lg">
                  Loading...
                </div>
              )}
  
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'create' && renderCreateTask()}
              {activeTab === 'tasks' && renderMyTasks()}
              {activeTab === 'settings' && renderSettings()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}