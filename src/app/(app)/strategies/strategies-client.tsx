'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStrategy, updateStrategy, deleteStrategy } from '@/actions/strategies'

type Strategy = {
  id: string
  name: string
  market: string | null
  timeframe: string | null
  entryConditions: any
  slRules: any
  tpRules: any
  riskRules: any
  exitConditions: any
  sessionRules: any
  newsRules: any
  notes: string | null
  isActive: boolean
  _count: { trades: number }
}

export default function StrategiesClient({ initialStrategies }: { initialStrategies: Strategy[] }) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return
    await deleteStrategy(id)
    router.refresh()
  }

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingStrategy(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <p className="text-zinc-400 text-sm">
          Define and refine your trading strategies completely custom to your methodology.
        </p>
        <button 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          Create Strategy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {initialStrategies.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            No strategies created yet. Click "Create Strategy" to begin.
          </div>
        )}
        {initialStrategies.map(strategy => (
          <div key={strategy.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col h-full hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-zinc-100">{strategy.name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${strategy.isActive ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {strategy.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex gap-2 mb-4 text-xs font-medium text-zinc-400">
              {strategy.market && <span className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">{strategy.market}</span>}
              {strategy.timeframe && <span className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">{strategy.timeframe}</span>}
            </div>
            
            <p className="text-sm text-zinc-400 mb-4 line-clamp-3 flex-1">
              {strategy.notes || 'No description or notes provided.'}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-zinc-500">
              <div className="bg-zinc-950 p-2 rounded">
                <span className="block font-medium text-zinc-400 mb-1">Trades Linked</span>
                <span className="text-white text-lg font-bold">{strategy._count.trades}</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded">
                <span className="block font-medium text-zinc-400 mb-1">Win Rate</span>
                <span className="text-white text-lg font-bold">--%</span>
              </div>
            </div>

            <div className="flex justify-end items-center mt-auto border-t border-zinc-800 pt-3 space-x-3">
              <button 
                onClick={() => handleEdit(strategy)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(strategy.id)}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <StrategyModal 
          strategy={editingStrategy}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}

function StrategyModal({ strategy, onClose }: { strategy: Strategy | null, onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: strategy?.name || '',
    market: strategy?.market || '',
    timeframe: strategy?.timeframe || '',
    notes: strategy?.notes || '',
    entryConditionsStr: JSON.stringify(strategy?.entryConditions || {}, null, 2),
    slRulesStr: JSON.stringify(strategy?.slRules || {}, null, 2),
    tpRulesStr: JSON.stringify(strategy?.tpRules || {}, null, 2),
    riskRulesStr: JSON.stringify(strategy?.riskRules || {}, null, 2),
    exitConditionsStr: JSON.stringify(strategy?.exitConditions || {}, null, 2),
    isActive: strategy?.isActive ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        name: formData.name,
        market: formData.market,
        timeframe: formData.timeframe,
        notes: formData.notes,
        entryConditions: JSON.parse(formData.entryConditionsStr || '{}'),
        slRules: JSON.parse(formData.slRulesStr || '{}'),
        tpRules: JSON.parse(formData.tpRulesStr || '{}'),
        riskRules: JSON.parse(formData.riskRulesStr || '{}'),
        exitConditions: JSON.parse(formData.exitConditionsStr || '{}'),
        isActive: formData.isActive
      }

      if (strategy) {
        await updateStrategy(strategy.id, data)
      } else {
        await createStrategy(data)
      }
      onClose()
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Error saving strategy. Please check JSON formatting.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-xl my-8">
        <h3 className="text-xl font-bold text-white mb-4">
          {strategy ? 'Edit Strategy' : 'Create Strategy'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Strategy Name</label>
              <input 
                required
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Market (e.g. Forex, Crypto)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
                value={formData.market}
                onChange={e => setFormData({...formData, market: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Timeframe (e.g. 15m, 4H)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
                value={formData.timeframe}
                onChange={e => setFormData({...formData, timeframe: e.target.value})}
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-zinc-300">Active Strategy</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">General Notes / Description</label>
            <textarea 
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Entry Conditions (JSON)</label>
              <textarea 
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-300 text-xs font-mono"
                value={formData.entryConditionsStr}
                onChange={e => setFormData({...formData, entryConditionsStr: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Risk Rules (JSON)</label>
              <textarea 
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-300 text-xs font-mono"
                value={formData.riskRulesStr}
                onChange={e => setFormData({...formData, riskRulesStr: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Stop Loss Rules (JSON)</label>
              <textarea 
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-300 text-xs font-mono"
                value={formData.slRulesStr}
                onChange={e => setFormData({...formData, slRulesStr: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Take Profit & Exit Rules (JSON)</label>
              <textarea 
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-300 text-xs font-mono"
                value={formData.tpRulesStr}
                onChange={e => setFormData({...formData, tpRulesStr: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Strategy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
